import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAcademicYear } from '@/types';

export interface SchoolSettings {
  id: string;
  school_name: string;
  motto: string;
  email: string;
  phone: string;
  address: string;
  academic_year: string;
  term: string;
  principal_name: string;
  closing_date: string | null;
  next_term_begins: string | null;
  logo_url: string | null;
}

const getDefaultSettings = (): SchoolSettings => ({
  id: '',
  school_name: 'EDISMS School',
  motto: 'Excellence in Education',
  email: '',
  phone: '',
  address: '',
  academic_year: getCurrentAcademicYear(),
  term: 'First Term',
  principal_name: '',
  closing_date: null,
  next_term_begins: null,
  logo_url: null,
});

export function useSchoolSettings(schoolId?: string | null) {
  const [settings, setSettings] = useState<SchoolSettings>(getDefaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [schoolId]);

  const fetchSettings = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('school_settings')
      .select('*');
    
    // If a specific school_id is provided, filter by it
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    
    const { data, error } = await query.limit(1).maybeSingle();

    if (!error && data) {
      const defaults = getDefaultSettings();
      setSettings({
        id: data.id,
        school_name: data.school_name || defaults.school_name,
        motto: data.motto || defaults.motto,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        academic_year: data.academic_year || defaults.academic_year,
        term: data.term || defaults.term,
        principal_name: data.principal_name || '',
        closing_date: data.closing_date,
        next_term_begins: data.next_term_begins,
        logo_url: data.logo_url,
      });
    }
    setIsLoading(false);
  };

  // Get school initials from the school name
  const getSchoolInitials = (): string => {
    const words = settings.school_name.split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
      return words[0].substring(0, 4).toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
  };

  // Get current term number (1, 2, or 3)
  const getCurrentTermNumber = (): number => {
    const term = settings.term.toLowerCase();
    if (term.includes('first') || term.includes('1')) return 1;
    if (term.includes('second') || term.includes('2')) return 2;
    if (term.includes('third') || term.includes('3')) return 3;
    return 1;
  };

  return {
    settings,
    isLoading,
    refetch: fetchSettings,
    getSchoolInitials,
    getCurrentTermNumber,
  };
}
