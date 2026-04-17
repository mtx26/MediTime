import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { MedicineReviewSuggestion, InputDropdownProps } from '@meditime/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const SearchInput = ({
  name,
  dose,
  onChangeName,
  onChangeDose,
  onChangeBoxCapacity,
  onChangeStockQuantity,
  onChangeCodeFmd,
  fetchSuggestions,
}: InputDropdownProps) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<MedicineReviewSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputValue(name);
  }, [name]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSelect = (item: MedicineReviewSuggestion) => {
    const onlyNumbers = parseInt(String(item.dose || '').replace(/\D/g, ''), 10) || 0;
    const itemName = item.name;
    setInputValue(itemName);
    onChangeName(itemName);
    onChangeDose(onlyNumbers);
    const parsedCapacity = Number(item.conditionnement) || 0;
    onChangeBoxCapacity(parsedCapacity);
    onChangeStockQuantity(parsedCapacity);
    if (item.code_fmd) {
      onChangeCodeFmd(item.code_fmd);
    }
    setShowDropdown(false);
    setSuggestions([]);
  };

  useEffect(() => {
    if (!name || name.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchData = async () => {
      const results = await fetchSuggestions(name, dose);
      setSuggestions((results || []) as MedicineReviewSuggestion[]);
    };

    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [name, dose]);

  return (
    <div className="relative flex mb-3 gap-3">
      <div className="flex-1">
        <Label className="text-muted-foreground text-xs">{t('boxes.name')}</Label>
        <Input
          ref={inputRef}
          type="text"
          required
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChangeName(e.target.value);
            setShowDropdown(true);
          }}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={t('boxes.start_typing')}
          aria-label={t('boxes.name')}
        />
      </div>
      <div className="w-24">
        <Label className="text-muted-foreground text-xs">{t('boxes.dose')}</Label>
        <Input
          type="number"
          required
          value={dose ?? ''}
          onChange={(e) => onChangeDose(e.target.value === '' ? 0 : Number(e.target.value))}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          aria-label={t('boxes.dose')}
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full z-50 mt-1 bg-popover border rounded-md shadow-md max-h-50 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => handleSelect(item)}
            >
              {item.name} - {item.dose} - {item.conditionnement} {item.forme_pharmaceutique}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
