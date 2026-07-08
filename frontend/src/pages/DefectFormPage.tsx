import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useDefect, useCreateDefect, useUpdateDefect } from '../hooks/useDefects';
import { useRequirements } from '../hooks/useRequirements';
import { useSystems } from '../hooks/useSystems';

const DEFECT_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed', "Won't Fix"];
const DEFECT_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

interface FormValues {
  title: string;
  description: string;
  severity: string;
  status: string;
  requirement_id: string;
  system_id: string;
  steps_to_reproduce: string;
  environment: string;
  resolution_notes: string;
}

export default function DefectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: defect } = useDefect(id ? Number(id) : 0);
  const { data: reqsData } = useRequirements({ page_size: 200 });
  const { data: systems = [] } = useSystems();
  const createMutation = useCreateDefect();
  const updateMutation = useUpdateDefect(id ? Number(id) : 0);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      severity: 'Medium',
      status: 'Open',
      requirement_id: '',
      system_id: '',
      steps_to_reproduce: '',
      environment: '',
      resolution_notes: '',
    },
  });

  useEffect(() => {
    if (defect) {
      reset({
        title: defect.title,
        description: defect.description ?? '',
        severity: defect.severity,
        status: defect.status,
        requirement_id: defect.requirement_id?.toString() ?? '',
        system_id: defect.system_id?.toString() ?? '',
        steps_to_reproduce: defect.steps_to_reproduce ?? '',
        environment: defect.environment ?? '',
        resolution_notes: defect.resolution_notes ?? '',
      });
    }
  }, [defect, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      severity: values.severity,
      status: values.status,
      requirement_id: values.requirement_id ? Number(values.requirement_id) : null,
      system_id: values.system_id ? Number(values.system_id) : null,
      steps_to_reproduce: values.steps_to_reproduce.trim() || null,
      environment: values.environment.trim() || null,
      resolution_notes: values.resolution_notes.trim() || null,
    };

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync(payload);
      navigate(`/defects/${result.id}`);
    } else {
      const result = await createMutation.mutateAsync(payload);
      navigate(`/defects/${result.id}`);
    }
  }

  const error = createMutation.error || updateMutation.error;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to={isEdit ? `/defects/${id}` : '/defects'} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> {isEdit ? 'Back to Defect' : 'Back to Defects'}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Defect' : 'New Defect'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(error as any)?.response?.data?.detail ?? 'An error occurred.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Defect Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                {...register('severity')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEFECT_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEFECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Requirement</label>
              <select
                {...register('requirement_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {reqsData?.items.map(r => <option key={r.id} value={r.id}>{r.req_id}: {r.title}</option>)}
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Reproduction & Resolution</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</label>
            <textarea
              {...register('steps_to_reproduce')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="1. Open the app&#10;2. Navigate to...&#10;3. Observe that..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
            <input
              {...register('environment')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Production, Chrome 120, macOS 14"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
            <textarea
              {...register('resolution_notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            to={isEdit ? `/defects/${id}` : '/defects'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Defect'}
          </button>
        </div>
      </form>
    </div>
  );
}
