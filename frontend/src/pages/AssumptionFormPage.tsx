import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useAssumption, useCreateAssumption, useUpdateAssumption } from '../hooks/useAssumptions';
import { useStakeholders } from '../hooks/useStakeholders';

const CATEGORY_OPTIONS = ['Assumption', 'Open Question', 'Investigation Task', 'Risk'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Validated', 'Invalidated', 'Closed'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];

interface FormValues {
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  owner_id: string;
  related_requirement_id: string;
  resolution_notes: string;
}

export default function AssumptionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: assumption } = useAssumption(id ? Number(id) : null);
  const { data: stakeholders = [] } = useStakeholders();
  const createMutation = useCreateAssumption();
  const updateMutation = useUpdateAssumption();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      category: 'Assumption',
      status: 'Open',
      priority: 'Medium',
      owner_id: '',
      related_requirement_id: '',
      resolution_notes: '',
    },
  });

  useEffect(() => {
    if (assumption) {
      reset({
        title: assumption.title,
        description: assumption.description,
        category: assumption.category,
        status: assumption.status,
        priority: assumption.priority,
        owner_id: assumption.owner?.id?.toString() ?? '',
        related_requirement_id: assumption.related_requirement?.id?.toString() ?? '',
        resolution_notes: assumption.resolution_notes ?? '',
      });
    }
  }, [assumption, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      status: values.status,
      priority: values.priority,
      owner_id: values.owner_id ? Number(values.owner_id) : null,
      related_requirement_id: values.related_requirement_id ? Number(values.related_requirement_id) : null,
      resolution_notes: values.resolution_notes.trim() || null,
    };

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({ id: Number(id), payload });
      navigate(`/assumptions/${result.id}`);
    } else {
      const result = await createMutation.mutateAsync(payload);
      navigate(`/assumptions/${result.id}`);
    }
  }

  const error = createMutation.error || updateMutation.error;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to={isEdit ? `/assumptions/${id}` : '/assumptions'} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> {isEdit ? 'Back to Item' : 'Back to Assumptions'}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Item' : 'New Assumption / Unknown'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(error as any)?.response?.data?.detail ?? 'An error occurred.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Core Details</h2>

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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Classification</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('category', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select {...register('priority')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select {...register('owner_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">None</option>
                {stakeholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Resolution</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
            <textarea
              {...register('resolution_notes')}
              rows={3}
              placeholder="How was this resolved or validated?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to={isEdit ? `/assumptions/${id}` : '/assumptions'} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
