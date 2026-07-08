import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useTestCase, useCreateTestCase, useUpdateTestCase } from '../hooks/useTestCases';
import { useRequirements } from '../hooks/useRequirements';

const TEST_CASE_STATUSES = ['Draft', 'Ready', 'Passed', 'Failed', 'Blocked'];

interface FormValues {
  title: string;
  description: string;
  preconditions: string;
  steps: string;
  expected_result: string;
  status: string;
  requirement_id: string;
}

export default function TestCaseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: tc } = useTestCase(id ? Number(id) : 0);
  const { data: reqsData } = useRequirements({ page_size: 200 });
  const createMutation = useCreateTestCase();
  const updateMutation = useUpdateTestCase(id ? Number(id) : 0);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      preconditions: '',
      steps: '',
      expected_result: '',
      status: 'Draft',
      requirement_id: '',
    },
  });

  useEffect(() => {
    if (tc) {
      reset({
        title: tc.title,
        description: tc.description ?? '',
        preconditions: tc.preconditions ?? '',
        steps: tc.steps ?? '',
        expected_result: tc.expected_result ?? '',
        status: tc.status,
        requirement_id: tc.requirement_id?.toString() ?? '',
      });
    }
  }, [tc, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      preconditions: values.preconditions.trim() || null,
      steps: values.steps.trim() || null,
      expected_result: values.expected_result.trim() || null,
      status: values.status,
      requirement_id: values.requirement_id ? Number(values.requirement_id) : null,
    };

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync(payload);
      navigate(`/test-cases/${result.id}`);
    } else {
      const result = await createMutation.mutateAsync(payload);
      navigate(`/test-cases/${result.id}`);
    }
  }

  const error = createMutation.error || updateMutation.error;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to={isEdit ? `/test-cases/${id}` : '/test-cases'} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> {isEdit ? 'Back to Test Case' : 'Back to Test Cases'}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Test Case' : 'New Test Case'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(error as any)?.response?.data?.detail ?? 'An error occurred.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Test Case Details</h2>

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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TEST_CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Test Steps</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preconditions</label>
            <textarea
              {...register('preconditions')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="What must be true before running this test?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
            <textarea
              {...register('steps')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Verify that..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
            <textarea
              {...register('expected_result')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="What should happen when the test passes?"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            to={isEdit ? `/test-cases/${id}` : '/test-cases'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Test Case'}
          </button>
        </div>
      </form>
    </div>
  );
}
