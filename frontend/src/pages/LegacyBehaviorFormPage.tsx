import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useLegacyBehavior, useCreateLegacyBehavior, useUpdateLegacyBehavior } from '../hooks/useLegacyBehaviors';
import { useSystems } from '../hooks/useSystems';

const BEHAVIOR_TYPE_OPTIONS = ['Edge Case', 'Workaround', 'Undocumented Behavior', 'Known Bug', 'Manual Process'];
const STATUS_OPTIONS = ['Documented', 'Investigating', 'Addressed', 'Accepted Risk'];
const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];

interface FormValues {
  title: string;
  description: string;
  behavior_type: string;
  severity: string;
  status: string;
  system_id: string;
  related_requirement_id: string;
  steps_to_reproduce: string;
  expected_behavior: string;
  actual_behavior: string;
}

export default function LegacyBehaviorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: behavior } = useLegacyBehavior(id ? Number(id) : null);
  const { data: systems = [] } = useSystems();
  const createMutation = useCreateLegacyBehavior();
  const updateMutation = useUpdateLegacyBehavior();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      behavior_type: 'Edge Case',
      severity: 'Medium',
      status: 'Documented',
      system_id: '',
      related_requirement_id: '',
      steps_to_reproduce: '',
      expected_behavior: '',
      actual_behavior: '',
    },
  });

  useEffect(() => {
    if (behavior) {
      reset({
        title: behavior.title,
        description: behavior.description,
        behavior_type: behavior.behavior_type,
        severity: behavior.severity,
        status: behavior.status,
        system_id: behavior.system?.id?.toString() ?? '',
        related_requirement_id: behavior.related_requirement?.id?.toString() ?? '',
        steps_to_reproduce: behavior.steps_to_reproduce ?? '',
        expected_behavior: behavior.expected_behavior ?? '',
        actual_behavior: behavior.actual_behavior ?? '',
      });
    }
  }, [behavior, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      behavior_type: values.behavior_type,
      severity: values.severity,
      status: values.status,
      system_id: values.system_id ? Number(values.system_id) : null,
      related_requirement_id: values.related_requirement_id ? Number(values.related_requirement_id) : null,
      steps_to_reproduce: values.steps_to_reproduce.trim() || null,
      expected_behavior: values.expected_behavior.trim() || null,
      actual_behavior: values.actual_behavior.trim() || null,
    };

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({ id: Number(id), payload });
      navigate(`/legacy-behaviors/${result.id}`);
    } else {
      const result = await createMutation.mutateAsync(payload);
      navigate(`/legacy-behaviors/${result.id}`);
    }
  }

  const error = createMutation.error || updateMutation.error;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to={isEdit ? `/legacy-behaviors/${id}` : '/legacy-behaviors'} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> {isEdit ? 'Back to Behavior' : 'Back to Legacy Behaviors'}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Behavior' : 'New Legacy Behavior'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select {...register('behavior_type', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {BEHAVIOR_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select {...register('severity')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
              <select {...register('system_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">None</option>
                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Behavior Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</label>
            <textarea
              {...register('steps_to_reproduce')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Behavior</label>
            <textarea
              {...register('expected_behavior')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Behavior</label>
            <textarea
              {...register('actual_behavior')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to={isEdit ? `/legacy-behaviors/${id}` : '/legacy-behaviors'} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Behavior'}
          </button>
        </div>
      </form>
    </div>
  );
}
