import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ChevronRight, Save, AlertCircle } from 'lucide-react';
import { useRequirement, useCreateRequirement, useUpdateRequirement } from '../hooks/useRequirements';
import { useStakeholders } from '../hooks/useStakeholders';
import { useSystems } from '../hooks/useSystems';
import { SOURCE_OPTIONS, PRIORITY_OPTIONS, CONFIDENCE_OPTIONS, STATUS_OPTIONS } from '../lib/constants';
import { cn } from '../lib/utils';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  source: z.string().min(1, 'Source is required'),
  priority: z.string().min(1, 'Priority is required'),
  confidence: z.string().min(1, 'Confidence is required'),
  status: z.string().optional(),
  stakeholder_id: z.number().nullable().optional(),
  system_id: z.number().nullable().optional(),
  business_impact: z.string().nullable().optional(),
  technical_impact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags_input: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, required, error, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-200">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-100 placeholder:text-slate-500 bg-slate-900';

const selectClass =
  'w-full px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-100 bg-slate-900';

const textareaClass =
  'w-full px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-100 placeholder:text-slate-500 bg-slate-900 resize-y min-h-[80px]';

export default function RequirementFormPage() {
  const { reqId } = useParams<{ reqId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(reqId);

  const { data: existing, isLoading: loadingExisting } = useRequirement(reqId ?? '');
  const { data: stakeholders } = useStakeholders();
  const { data: systems } = useSystems();
  const createMutation = useCreateRequirement();
  const updateMutation = useUpdateRequirement();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      source: '',
      priority: 'Medium',
      confidence: 'Medium',
      status: 'Draft',
      stakeholder_id: null,
      system_id: null,
      business_impact: '',
      technical_impact: '',
      notes: '',
      tags_input: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEdit && existing) {
      reset({
        title: existing.title,
        description: existing.description,
        source: existing.source,
        priority: existing.priority,
        confidence: existing.confidence,
        status: existing.status,
        stakeholder_id: existing.stakeholder?.id ?? null,
        system_id: existing.system?.id ?? null,
        business_impact: existing.business_impact ?? '',
        technical_impact: existing.technical_impact ?? '',
        notes: existing.notes ?? '',
        tags_input: existing.tags.map((t) => t.name).join(', '),
      });
    }
  }, [existing, isEdit, reset]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const tags = values.tags_input
      ? values.tags_input
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const payload = {
      title: values.title,
      description: values.description,
      source: values.source,
      priority: values.priority,
      confidence: values.confidence,
      status: values.status || undefined,
      stakeholder_id: values.stakeholder_id || null,
      system_id: values.system_id || null,
      business_impact: values.business_impact || null,
      technical_impact: values.technical_impact || null,
      notes: values.notes || null,
      tags,
    };

    try {
      if (isEdit && reqId) {
        const updated = await updateMutation.mutateAsync({ reqId, payload });
        navigate(`/requirements/${updated.req_id}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        navigate(`/requirements/${created.req_id}`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/requirements" className="hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Requirements
        </Link>
        {isEdit && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link
              to={`/requirements/${reqId}`}
              className="hover:text-indigo-600 font-mono font-medium text-slate-200"
            >
              {reqId}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-200">{isEdit ? 'Edit' : 'New Requirement'}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-50 mb-8">
        {isEdit ? 'Edit Requirement' : 'New Requirement'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Info */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-700 pb-3">
            Core Information
          </h2>

          <FieldWrapper label="Title" required error={errors.title?.message}>
            <input
              {...register('title')}
              className={cn(inputClass, errors.title && 'border-red-300 focus:ring-red-400')}
              placeholder="Brief, descriptive title for this requirement"
            />
          </FieldWrapper>

          <FieldWrapper label="Description" required error={errors.description?.message}>
            <textarea
              {...register('description')}
              className={cn(textareaClass, errors.description && 'border-red-300 focus:ring-red-400', 'min-h-[120px]')}
              placeholder="Detailed description of the requirement..."
            />
          </FieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldWrapper label="Source" required error={errors.source?.message}>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(selectClass, errors.source && 'border-red-300 focus:ring-red-400')}
                  >
                    <option value="">Select a source...</option>
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              />
            </FieldWrapper>

            <FieldWrapper label="Priority" required error={errors.priority?.message}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(selectClass, errors.priority && 'border-red-300 focus:ring-red-400')}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              />
            </FieldWrapper>

            <FieldWrapper label="Confidence" required error={errors.confidence?.message}>
              <Controller
                name="confidence"
                control={control}
                render={({ field }) => (
                  <select {...field} className={selectClass}>
                    {CONFIDENCE_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              />
            </FieldWrapper>

            {isEdit && (
              <FieldWrapper label="Status">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className={selectClass}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                />
              </FieldWrapper>
            )}
          </div>
        </div>

        {/* Classification */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-700 pb-3">
            Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldWrapper label="Stakeholder">
              <Controller
                name="stakeholder_id"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    className={selectClass}
                  >
                    <option value="">No stakeholder</option>
                    {stakeholders?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              />
            </FieldWrapper>

            <FieldWrapper label="System">
              <Controller
                name="system_id"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    className={selectClass}
                  >
                    <option value="">No system</option>
                    {systems?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Tags" error={undefined}>
            <input
              {...register('tags_input')}
              className={inputClass}
              placeholder="Comma-separated tags: auth, backend, api"
            />
            <p className="text-xs text-slate-400 mt-1">Separate multiple tags with commas</p>
          </FieldWrapper>
        </div>

        {/* Impact & Notes */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-700 pb-3">
            Impact &amp; Notes
          </h2>

          <FieldWrapper label="Business Impact">
            <textarea
              {...register('business_impact')}
              className={textareaClass}
              placeholder="Describe the business impact of this requirement..."
            />
          </FieldWrapper>

          <FieldWrapper label="Technical Impact">
            <textarea
              {...register('technical_impact')}
              className={textareaClass}
              placeholder="Describe the technical impact or implementation considerations..."
            />
          </FieldWrapper>

          <FieldWrapper label="Notes">
            <textarea
              {...register('notes')}
              className={textareaClass}
              placeholder="Any additional notes or context..."
            />
          </FieldWrapper>
        </div>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-700 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Link
            to={isEdit ? `/requirements/${reqId}` : '/requirements'}
            className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? isEdit
                ? 'Saving...'
                : 'Creating...'
              : isEdit
                ? 'Save Changes'
                : 'Create Requirement'}
          </button>
        </div>
      </form>
    </div>
  );
}
