'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type PaymentScheduleType = 'UPFRONT' | 'SPLIT_50_50' | 'MILESTONE' | 'CUSTOM' | '';

interface PaymentMilestone {
  label:   string;
  percent: number;
  dueOn:   string;
}

interface Props {
  currency:          string;
  contractValue:     number;
  schedule:          PaymentScheduleType;
  depositPercent:    number;
  milestones:        PaymentMilestone[];
  onScheduleChange:  (s: PaymentScheduleType) => void;
  onDepositChange:   (n: number) => void;
  onMilestonesChange:(m: PaymentMilestone[]) => void;
}

const SCHEDULE_OPTIONS = [
  { value: '',            label: 'No payment schedule',    desc: 'Add manually later' },
  { value: 'UPFRONT',     label: '100% on signing',        desc: 'Full payment due when contract is signed' },
  { value: 'SPLIT_50_50', label: '50/50 split',            desc: '50% on signing, 50% on completion' },
  { value: 'MILESTONE',   label: 'Milestone-based',        desc: 'Payments tied to project milestones' },
  { value: 'CUSTOM',      label: 'Custom split',           desc: 'Define your own payment schedule' },
];

export function PaymentSchedulePicker({
  currency, contractValue, schedule, depositPercent,
  milestones, onScheduleChange, onDepositChange, onMilestonesChange,
}: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(n);
  const pct = (p: number) => contractValue > 0 ? fmt((contractValue * p) / 100) : `${p}%`;

  const addMilestone = () => {
    onMilestonesChange([...milestones, { label: 'New milestone', percent: 25, dueOn: 'completion' }]);
  };

  const removeMilestone = (i: number) => {
    onMilestonesChange(milestones.filter((_, idx) => idx !== i));
  };

  const updateMilestone = (i: number, field: keyof PaymentMilestone, value: string | number) => {
    const updated = [...milestones];
    updated[i] = { ...updated[i], [field]: value };
    onMilestonesChange(updated);
  };

  const totalPercent = milestones.reduce((s, m) => s + Number(m.percent), 0);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payment Schedule
        </label>
        <div className="grid grid-cols-1 gap-2">
          {SCHEDULE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onScheduleChange(opt.value as PaymentScheduleType)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                schedule === opt.value
                  ? 'border-primary bg-primary-50 dark:bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
            >
              <p className={`text-sm font-medium ${schedule === opt.value ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
              {/* Preview amounts */}
              {contractValue > 0 && opt.value === 'UPFRONT' && (
                <p className="text-xs text-primary font-medium mt-1">→ {fmt(contractValue)} on signing</p>
              )}
              {contractValue > 0 && opt.value === 'SPLIT_50_50' && (
                <p className="text-xs text-primary font-medium mt-1">→ {pct(50)} on signing · {pct(50)} on completion</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom split deposit % */}
      {(schedule === 'CUSTOM' || schedule === 'MILESTONE') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deposit percentage (due on signing)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number" min={0} max={100}
              value={depositPercent}
              onChange={(e) => onDepositChange(Number(e.target.value))}
              className="input w-24 text-center"
            />
            <span className="text-sm text-gray-500">%</span>
            {contractValue > 0 && (
              <span className="text-sm font-medium text-primary">= {pct(depositPercent)}</span>
            )}
          </div>
        </div>
      )}

      {/* Milestone payment breakdown */}
      {schedule === 'MILESTONE' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment milestones
            </label>
            <span className={`text-xs font-medium ${totalPercent > 100 ? 'text-danger' : totalPercent === 100 ? 'text-green-500' : 'text-gray-400'}`}>
              Total: {totalPercent}%
            </span>
          </div>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex-1">
                  <input
                    className="input text-sm w-full mb-1.5"
                    placeholder="Milestone name"
                    value={m.label}
                    onChange={(e) => updateMilestone(i, 'label', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={0} max={100}
                      className="input text-sm w-20 text-center"
                      value={m.percent}
                      onChange={(e) => updateMilestone(i, 'percent', Number(e.target.value))}
                    />
                    <span className="text-xs text-gray-500">%</span>
                    {contractValue > 0 && (
                      <span className="text-xs text-primary font-medium">{pct(Number(m.percent))}</span>
                    )}
                    <select
                      className="input text-xs flex-1"
                      value={m.dueOn}
                      onChange={(e) => updateMilestone(i, 'dueOn', e.target.value)}
                    >
                      <option value="signing">On signing</option>
                      <option value="completion">On completion</option>
                      <option value="milestone_1">Milestone 1</option>
                      <option value="milestone_2">Milestone 2</option>
                      <option value="milestone_3">Milestone 3</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  className="text-gray-400 hover:text-danger transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMilestone}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-primary hover:border-primary text-sm rounded-xl transition-colors"
            >
              <Plus className="h-4 w-4" /> Add payment milestone
            </button>
          </div>
          {totalPercent !== 100 && milestones.length > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Milestones should add up to 100% (currently {totalPercent}%)
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {schedule && contractValue > 0 && (
        <div className="p-3 bg-primary-50 dark:bg-primary/10 rounded-xl border border-primary-100 dark:border-primary/20">
          <p className="text-xs font-semibold text-primary mb-1">Payment summary</p>
          {schedule === 'UPFRONT' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{fmt(contractValue)} due on signing</p>
          )}
          {schedule === 'SPLIT_50_50' && (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-400">{pct(50)} due on signing</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{pct(50)} due on completion</p>
            </>
          )}
          {(schedule === 'CUSTOM' || schedule === 'MILESTONE') && depositPercent > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{pct(depositPercent)} deposit due on signing</p>
          )}
          <p className="text-xs text-green-600 mt-1 font-medium">
            ✓ A deposit invoice will be created automatically when the client signs
          </p>
        </div>
      )}
    </div>
  );
}
