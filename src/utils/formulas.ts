import { StatItem } from '../types';

export const formatStatValue = (id: string, type: string, value: any, roundToK: boolean = true) => {
  if (type === 'DURATION') {
    const hours = Math.floor(value / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days} д. ${remHours} ч.`;
  }
  if (type === 'DATE') {
    return new Date(value).toLocaleDateString('ru-RU');
  }
  if (type === 'DECIMAL') {
    if (id.startsWith('dis-') || id.startsWith('tpacks-distance')) {
      return (value / 100000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' км';
    }
    const numVal = Number(value);
    if (roundToK && Math.abs(numVal) >= 1000) {
      return (numVal / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + 'к';
    }
    return numVal.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  }
  if (type === 'INTEGER') {
    const numVal = Number(value);
    if (roundToK && Math.abs(numVal) >= 1000) {
      return (numVal / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + 'к';
    }
    return numVal.toLocaleString('ru-RU');
  }
  return String(value);
};

export const formatCustomValue = (val: number | null, formatId: string, formats: any[], roundToK: boolean = true) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const format = formats.find((f: any) => f.id === formatId);
  if (!format) return String(val);

  let resultVal: any = val;

  if (format.formula) {
    try {
      const fn = new Function('x', `return ${format.formula}`);
      resultVal = fn(val);
    } catch (e) {
      console.error('Formula error', e);
      resultVal = 'Ошибка';
    }
  } else {
    // Legacy fallback
    const multiplier = format.multiplier !== undefined ? format.multiplier : 1;
    resultVal = val * multiplier;
  }

  // Логика округления до тысяч (к)
  let isKRounded = false;
  const forbiddenFormats = ['ratio', 'percent', 'date', 'distance', 'duration', 'duration_hours'];
  
  if (roundToK && typeof resultVal === 'number' && Math.abs(resultVal) >= 1000 && 
      !forbiddenFormats.includes(format.id) && 
      !forbiddenFormats.includes(format.special || '')) {
      resultVal = resultVal / 1000;
      isKRounded = true;
  }

  let finalStr = '';
  if (resultVal instanceof Date) {
    if (isNaN(resultVal.getTime())) {
      finalStr = 'Неверная дата';
    } else {
      finalStr = resultVal.toLocaleDateString('ru-RU');
    }
  } else if (typeof resultVal === 'number') {
    if (isKRounded) {
      finalStr = resultVal.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
    } else {
      const parts = resultVal.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      finalStr = parts.join(',');
    }
  } else if (typeof resultVal === 'string' && /^-?\d+(\.\d+)?$/.test(resultVal)) {
    const parts = resultVal.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    finalStr = parts.join(',');
  } else {
    finalStr = String(resultVal);
  }

  return `${finalStr}${isKRounded ? 'к' : ''}${format.suffix ? ' ' + format.suffix : ''}`;
};

export const evaluateFormula = (formula: string, stats: StatItem[]) => {
  let parsedFormula = formula;
  const matches = formula.match(/\{([^}]+)\}/g);
  if (matches) {
    for (const match of matches) {
      const statId = match.slice(1, -1);
      const stat = stats.find(s => s.id === statId);
      const value = stat ? Number(stat.value) || 0 : 0;
      parsedFormula = parsedFormula.replace(match, String(value));
    }
  }
  
  try {
    // Basic sanitization to prevent executing arbitrary code
    if (/[^0-9+\-*/().\s]/.test(parsedFormula)) {
      return 0;
    }
    const result = new Function(`return ${parsedFormula}`)();
    const numResult = Number(result);
    return isNaN(numResult) || !isFinite(numResult) ? 0 : numResult;
  } catch (e) {
    return 0;
  }
};

export function renderFormulaToHTML(formula: string) {
  if (!formula) return '';
  const escaped = formula.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/\{([^}]+)\}/g, (match, attr) => {
    return `<span contenteditable="false" class="inline-flex items-center bg-emerald-500/20 text-emerald-400 rounded px-1.5 mx-0.5 text-xs font-bold select-none align-middle cursor-help" data-attr="${attr}">${attr}</span>`;
  });
}

export function parseFormulaHTML(element: HTMLElement): string {
  let result = '';
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.attr) {
        result += `{${el.dataset.attr}}`;
      } else {
        result += parseFormulaHTML(el);
      }
    }
  }
  return result;
}
