import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useDecision, useCreateDecision, useUpdateDecision } from '../hooks/useDecisions';
import { useStakeholders } from '../hooks/useStakeholders';
import { useSystems } from '../hooks/useSystems';

const DECISION_STATUSES = ['Proposed', 'Accepted', 'Superseded', 'Rejected'];

interface FormValues {
  title: string;
  description: string;
  rationale: string;
  status: string;
  decision_date: string;
  alternatives_considered: string;
  outcome: string;
  made_by_id: string;
  system_id: string;
  tag_names: string;
  related_requirement_ids: string;
}

export default function DecisionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: decision } = useDecision(id ? Number(id) : null);
  const { data: stakeholders = [] } = useStakeholders();
  const { data: systems = [] } = useSystems();
  const createMutation = useCreateDecision();
  const updateMutation = useUpdateDecision();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      rationale: '',
      status: 'Proposed',
      decision_date: '',
      alternatives_considered: '',
      outcome: '',
      made_by_id: '',
      system_id: '',
      tag_names: '',
      related_requirement_ids: '',
    },
  });

  useEffect(() => {
    if (decision) {
      reset({
        title: decision.title,
        description: decision.description,
        rationale: decision.rationale,
        status: decision.status,
        decision_date: decision.decision_date ?? '',
        alternatives_considered: decision.alternatives_considered ?? '',
        outcome: decision.outcome ?? '',
        made_by_id: decision.made_by?.id?.toString() ?? '',
        system_id: decision.system?.id?.toString() ?? '',
        tag_names: decision.tags.map(t => t.name).join(', '),
        related_requirement_ids: decision.related_requirements.map(r => r.id).join(', '),
      });
    }
  }, [decision, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      rationale: values.rationale.trim(),
      status: values.status,
      decision_date: values.decision_date || null,
      alternatives_considered: values.alternatives_considered.trim() || null,
      outcome: values.outcome.trim() || null,
      made_by_id: values.made_by_id ? Number(values.made_by_id) : null,
      system_id: values.system_id ? Number(values.system_id) : null,
      tag_names: values.tag_names.split(',').map(s => s.trim()).filter(Boolean),
      related_requirement_ids: values.related_requirement_ids
        .split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n)),
    };

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({ id: Number(id), payload });
      navigate(`/decisions/${result.id}`);
    } else {
      const result = await createMutation.mutateAsync(payload);
      navigate(`/decisions/${result.id}`);
    }
  }

  const error = createMutation.error || updateMutation.error;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to={isEdit ? `/decisions/${id}` : '/decisions'} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> {isEdit ? 'Back to Decision' : 'Back to Decisions'}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Decision' : 'New Decision'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(error as any)?.response?.data?.detail ?? 'An error occurred.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Core Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rationale *</label>
            <textarea
              {...register('rationale', { required: 'Rationale is required' })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Why was this decision made?"
            />
            {errors.rationale && <p className="mt-1 text-xs text-red-600">{errors.rationale.message}</p>}
          </div>
        </div>

        {/* Classification */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Classification</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DECISION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decision Date</label>
              <input
                type="date"
                {...register('decision_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Made By (Stakeholder)</label>
              <select
                {...register('made_by_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {stakeholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
              <select
                {...register('system_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              {...register('tag_names')}
              placeholder="e.g. architecture, database, security"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Additional */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Additional Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alternatives Considered</label>
            <textarea
              {...register('alternatives_considered')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
            <textarea
              {...register('outcome')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            to={isEdit ? `/decisions/${id}` : '/decisions'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Decision'}
          </button>
        </div>
      </form>
    </div>
  );
}
