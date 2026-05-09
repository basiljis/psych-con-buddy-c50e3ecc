import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, User, FileText, CheckCircle, ClipboardList, Save, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getProtocolChecklistData } from "@/data/protocolChecklistData";
import { useProtocols } from "@/hooks/useProtocols";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { generateConsentPDF } from "@/components/ConsentPDF";
import { useChecklistData } from "@/hooks/useChecklistData";
import { useProtocolChecklistData } from '@/hooks/useProtocolChecklistData';
import { ProtocolResultsPanel } from '@/components/ProtocolResultsPanel';
import { ProtocolChecklistPaginated } from '@/components/ProtocolChecklistPaginated';
import { AssistanceDirectionsPanel } from '@/components/AssistanceDirectionsPanel';
import { ProtocolConclusionPanel } from '@/components/ProtocolConclusionPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EducationLevelSelector, type EducationLevel } from "@/components/EducationLevelSelector";
import { differenceInYears, differenceInMonths, parseISO, differenceInDays, addDays } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PreviousProtocolDialog } from "@/components/PreviousProtocolDialog";
import { Eye } from "lucide-react";
import { analyzeProtocolResults } from "@/utils/assistanceDirections";
import { generateProtocolConclusion } from "@/utils/protocolRecommendations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { ChildSelector } from "@/components/ChildSelector";
import { useQueryClient } from "@tanstack/react-query";

// Интерфейсы для данных протокола и документов
interface ChildData {
  fullName: string;
  birthDate: string;
  age: string;
  gender: string;
  classNumber: string;
  classLetter: string;
  address: string;
  registrationAddress: string;
  sameAsAddress: boolean;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  whobrought: string;
  relationship: string;
  educationalOrganization: string;
}

interface DocumentCheck {
  id: string;
  name: string;
  required: boolean;
  present: boolean;
}

interface ProtocolData {
  childData: ChildData;
  documents: DocumentCheck[];
  consultationType: "primary" | "secondary";
  consultationDate: string;
  reason: string;
  previousConsultations: string;
  ppkNumber?: string;
  sessionTopic?: string;
  meetingType?: "scheduled" | "unscheduled";
  conclusionText?: string;
  parentConsent?: boolean;
  parentConsentAcknowledged?: boolean; // Подтверждение ознакомления с заключением
  checklistStarted?: boolean; // Флаг начала заполнения чек-листа
  checklistConfirmed?: boolean; // Флаг подтверждения завершения чек-листа
}

const initialDocuments: DocumentCheck[] = [
  { id: "representation", name: "Представление педагогического работника", required: true, present: false },
  { id: "psychologist", name: "Заключение педагога-психолога", required: true, present: false },
  { id: "logoped", name: "Заключение учителя-логопеда", required: false, present: false },
  { id: "defectologist", name: "Заключение учителя-дефектолога", required: false, present: false },
  { id: "social", name: "Заключение социального педагога", required: false, present: false },
  { id: "medical", name: "Справка о состоянии здоровья", required: false, present: false },
  { id: "characteristic", name: "Характеристика обучающегося", required: true, present: false },
  { id: "products", name: "Результаты продуктивной деятельности", required: false, present: false },
  { id: "cpmpk", name: "Заключение ЦПМПК г. Москвы (при наличии)", required: false, present: false },
  { id: "ipr", name: "Индивидуальная программа реабилитации и абилитации для ребёнка-инвалида (при наличии)", required: false, present: false },
];

export const ProtocolForm = ({
  onProtocolSave,
  editingProtocol
}: {
  onProtocolSave: (data: ProtocolData) => void;
  editingProtocol?: any;
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<"preschool" | "elementary" | "middle" | "high">("elementary");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const initialFormDataRef = useRef<string>("");
  const [previousProtocols, setPreviousProtocols] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<any | null>(null);
  const [showProtocolDialog, setShowProtocolDialog] = useState(false);
  const [savedProtocolId, setSavedProtocolId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  
  // Таймаут сессии 15 минут
  useSessionTimeout();

  const { saveProtocol, updateProtocol } = useProtocols();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const subscriptionStatus = useSubscriptionStatus();
  const { getChecklistByLevelAndType, loading: checklistLoading } = useChecklistData();
  const {
    getBlocksForEducationLevel,
    updateItemScore,
    calculateBlockScore,
    loading: protocolChecklistLoading
  } = useProtocolChecklistData();
  const { profile, isAdmin, isRegionalOperator, user } = useAuth();

  const [formData, setFormData] = useState<ProtocolData>({
    childData: {
      fullName: "",
      birthDate: "",
      age: "",
      gender: "",
      classNumber: "",
      classLetter: "",
      address: "",
      registrationAddress: "",
      sameAsAddress: false,
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      whobrought: "",
      relationship: "",
      educationalOrganization: ""
    },
    documents: initialDocuments,
    consultationType: "primary",
    consultationDate: new Date().toISOString().split('T')[0],
    reason: "",
    previousConsultations: "",
    ppkNumber: "",
    sessionTopic: "",
    meetingType: "scheduled",
    conclusionText: "",
    parentConsent: false,
    parentConsentAcknowledged: false,
    checklistStarted: false,
    checklistConfirmed: false
  });

  // Инициализация данных при редактировании
  useEffect(() => {
    if (editingProtocol) {
      console.log('Loading editing protocol:', editingProtocol);
      
      if (editingProtocol.protocol_data) {
        setFormData(editingProtocol.protocol_data);
      }
      
      if (editingProtocol.education_level) {
        setSelectedLevel(editingProtocol.education_level);
      }
    }
  }, [editingProtocol, selectedLevel]);

  // Прелоад данных ребёнка из карточки ребёнка
  useEffect(() => {
    if (editingProtocol) return;
    try {
      const raw = sessionStorage.getItem("ppk_prefill_child");
      if (!raw) return;
      sessionStorage.removeItem("ppk_prefill_child");
      const prefill = JSON.parse(raw);
      if (prefill?.educationLevel) {
        setSelectedLevel(prefill.educationLevel);
      }
      setFormData(prev => ({
        ...prev,
        childData: {
          ...prev.childData,
          fullName: prefill.fullName || prev.childData.fullName,
          birthDate: prefill.birthDate || prev.childData.birthDate,
          gender: prefill.gender || prev.childData.gender,
          parentName: prefill.parentName || prev.childData.parentName,
          parentPhone: prefill.parentPhone || prev.childData.parentPhone,
          parentEmail: prefill.parentEmail || prev.childData.parentEmail,
          educationalOrganization: prefill.educationalOrganization || prev.childData.educationalOrganization,
        },
      }));
      toast({
        title: t('protocolForm.toasts.prefillTitle'),
        description: t('protocolForm.toasts.prefillDesc'),
      });
    } catch (e) {
      console.error("Failed to apply ppk prefill:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initialFormDataRef.current = JSON.stringify(formData);
  }, [editingProtocol]);

  useEffect(() => {
    const currentFormDataString = JSON.stringify(formData);
    setHasUnsavedChanges(currentFormDataString !== initialFormDataRef.current);
  }, [formData]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && canSaveProtocol()) {
        saveProtocolData(true);
        toast({
          title: t('protocolForm.toasts.autosaveTitle'),
          description: t('protocolForm.toasts.autosaveDesc')
        });
      }
    }, 120000);

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, formData]);

  useEffect(() => {
    const loadPreviousProtocols = async () => {
      if (formData.consultationType === "secondary" && formData.childData.fullName && formData.childData.educationalOrganization) {
        try {
          const { data: protocols, error } = await supabase
            .from("protocols")
            .select("*")
            .eq("child_name", formData.childData.fullName)
            .eq("organization_id", formData.childData.educationalOrganization)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(5);

          if (error) {
            console.error("Error loading previous protocols:", error);
            return;
          }

          if (protocols && protocols.length > 0) {
            setPreviousProtocols(protocols);
            const historyText = protocols
              .map((p: any, index: number) => {
                const date = new Date(p.created_at).toLocaleDateString("ru-RU");
                const conclusion = p.protocol_data?.conclusionText || "Заключение не сохранено";
                const ppkNumber = p.ppk_number || "Номер не указан";
                return `${index + 1}. Протокол №${ppkNumber} от ${date}:\n${conclusion}`;
              })
              .join("\n\n---\n\n");

            setFormData(prev => ({
              ...prev,
              previousConsultations: historyText
            }));
          } else {
            setPreviousProtocols([]);
            setFormData(prev => ({
              ...prev,
              previousConsultations: "Предыдущие протоколы для данного обучающегося не найдены"
            }));
          }
        } catch (error) {
          console.error("Error loading previous protocols:", error);
        }
      } else if (formData.consultationType === "primary") {
        setPreviousProtocols([]);
        setFormData(prev => ({
          ...prev,
          previousConsultations: ""
        }));
      }
    };

    loadPreviousProtocols();
  }, [formData.consultationType, formData.childData.fullName, formData.childData.educationalOrganization]);

  useEffect(() => {
    if (profile && !isAdmin && !isRegionalOperator && profile.organization_id && !editingProtocol) {
      updateChildData("educationalOrganization", profile.organization_id);
    }
  }, [profile, isAdmin, isRegionalOperator, editingProtocol]);

  const checklistBlocks = useMemo(() => {
    if (!selectedLevel) return [];
    console.log('Getting blocks for level:', selectedLevel);
    return getBlocksForEducationLevel(selectedLevel);
  }, [selectedLevel, getBlocksForEducationLevel]);

  const updateChildData = (field: keyof ChildData, value: string) => {
    setFormData(prev => ({
      ...prev,
      childData: { ...prev.childData, [field]: value }
    }));
  };

  const isRequiredFieldEmpty = (value: string) => {
    return !value || value.trim() === "";
  };

  const getRequiredFieldClass = (value: string) => {
    return isRequiredFieldEmpty(value) ? "border-destructive focus:border-destructive" : "";
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isValidPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };
  const isFutureDate = (value: string) => {
    if (!value) return false;
    const d = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d.getTime() > today.getTime();
  };
  const isTooOldBirthDate = (value: string) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getFullYear() < 1900;
  };

  const FieldError = ({ messageKey }: { messageKey: string | null }) =>
    messageKey ? (
      <p className="text-xs text-destructive mt-1" role="alert">
        {t(`protocolForm.validation.${messageKey}`)}
      </p>
    ) : null;

  const childErrorKey = (field: keyof ChildData): string | null => {
    const v = (formData.childData[field] || "") as string;
    switch (field) {
      case "fullName": return isRequiredFieldEmpty(v) ? "requiredFullName" : null;
      case "birthDate":
        if (isRequiredFieldEmpty(v)) return "requiredBirthDate";
        if (isFutureDate(v)) return "futureBirthDate";
        if (isTooOldBirthDate(v)) return "tooOldBirthDate";
        return null;
      case "age": return isRequiredFieldEmpty(v) ? "requiredAge" : null;
      case "gender": return isRequiredFieldEmpty(v) ? "requiredGender" : null;
      case "classNumber": return isRequiredFieldEmpty(v) ? "requiredClassGroup" : null;
      case "educationalOrganization": return isRequiredFieldEmpty(v) ? "requiredOrganization" : null;
      case "address": return isRequiredFieldEmpty(v) ? "requiredAddress" : null;
      case "parentName": return isRequiredFieldEmpty(v) ? "requiredParentName" : null;
      case "parentPhone":
        if (isRequiredFieldEmpty(v)) return "requiredParentPhone";
        if (!isValidPhone(v)) return "invalidPhone";
        return null;
      case "parentEmail":
        if (!v) return null;
        return isValidEmail(v) ? null : "invalidEmail";
      case "whobrought": return isRequiredFieldEmpty(v) ? "requiredWhobrought" : null;
      case "relationship":
        if (formData.childData.whobrought === "other" && isRequiredFieldEmpty(v)) return "requiredRelationship";
        return null;
      default: return null;
    }
  };


  const canSaveProtocol = () => {
    const requiredFields = [
      formData.childData.fullName,
      formData.childData.birthDate,
      formData.childData.age,
      formData.childData.classNumber,
      formData.childData.gender,
      formData.childData.address,
      formData.childData.parentName,
      formData.childData.parentPhone,
      formData.childData.whobrought
    ];
    return requiredFields.every(field => !isRequiredFieldEmpty(field));
  };

  const canFinalizeProtocol = () => {
    if (!canSaveProtocol()) return false;
    
    const requiredDocs = formData.documents.filter(doc => doc.required);
    const allRequiredDocsPresent = requiredDocs.every(doc => doc.present);
    
    const protocolFieldsFilled = !isRequiredFieldEmpty(formData.reason) && 
                                 !isRequiredFieldEmpty(formData.consultationDate) &&
                                 !isRequiredFieldEmpty(formData.sessionTopic || '');
    
    const supabaseChecklist = getChecklistByLevelAndType(selectedLevel, 'protocol');
    if (supabaseChecklist) {
      const requiredChecklistItems = supabaseChecklist.items.filter(item => item.isRequired);
      const completedRequiredItems = checklistBlocks.reduce((sum, block) => {
        return sum + block.topics.reduce((topicSum: number, topic: any) => {
          return topicSum + topic.subtopics.reduce((subtopicSum: number, subtopic: any) => {
            return subtopicSum + subtopic.items.filter((item: any) => 
              requiredChecklistItems.some(req => req.id === item.checklist_item_id) &&
              item.score !== undefined
            ).length;
          }, 0);
        }, 0);
      }, 0);
      
      return allRequiredDocsPresent && protocolFieldsFilled && 
             (requiredChecklistItems.length === 0 || completedRequiredItems === requiredChecklistItems.length);
    }
    
    return allRequiredDocsPresent && protocolFieldsFilled;
  };

  const generateConsent = () => {
    if (!canSaveProtocol()) {
      toast({
        title: t('protocolForm.common.error'),
        description: t('protocolForm.toasts.fillRequiredForConsent'),
        variant: "destructive"
      });
      return;
    }

    generateConsentPDF(formData.childData);
    toast({
      title: t('protocolForm.toasts.consentGenerated'),
      description: t('protocolForm.toasts.consentReady')
    });
  };

  const updateDocument = (id: string, present: boolean) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc => 
        doc.id === id ? { ...doc, present } : doc
      )
    }));
  };

  const handleStepChange = (newStep: number) => {
    // Если уже есть сохранённый черновик или редактируем - просто переходим без повторного сохранения
    if (savedProtocolId || editingProtocol) {
      setCurrentStep(newStep);
      return;
    }
    
    // Для нового протокола показываем диалог только если есть несохранённые изменения
    if (hasUnsavedChanges && canSaveProtocol()) {
      setPendingStep(newStep);
      setShowSaveDialog(true);
    } else {
      setCurrentStep(newStep);
    }
  };

  const nextStep = async () => {
    if (currentStep < 5) {
      // Автосохранение черновика при переходе с первого шага
      if (currentStep === 1 && canSaveProtocol()) {
        await saveProtocolData(true);
        toast({
          title: t('protocolForm.toasts.draftSavedTitle'),
          description: t('protocolForm.toasts.draftSavedDesc')
        });
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleSaveAndContinue = async () => {
    await saveProtocolData(true);
    setHasUnsavedChanges(false);
    initialFormDataRef.current = JSON.stringify(formData);
    if (pendingStep !== null) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
    setShowSaveDialog(false);
  };

  const handleContinueWithoutSaving = () => {
    if (pendingStep !== null) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
    setShowSaveDialog(false);
  };

  // Function to sync child data to children table (auto-update)
  const syncChildDataToChildrenTable = async (
    childData: ChildData,
    educationLevel: string,
    organizationId: string
  ) => {
    if (!childData.fullName || !organizationId) return;

    // Check if child exists in children table
    const { data: existingChild, error: checkError } = await supabase
      .from("children")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("full_name", childData.fullName)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing child:', checkError);
      return;
    }

    const childRecord = {
      full_name: childData.fullName,
      birth_date: childData.birthDate || null,
      education_level: educationLevel || null,
      parent_name: childData.parentName || null,
      parent_phone: childData.parentPhone || null,
      notes: childData.address ? `Адрес: ${childData.address}` : null,
      organization_id: organizationId,
      is_active: true,
    };

    if (existingChild) {
      // Update existing child
      const { error: updateError } = await supabase
        .from("children")
        .update({
          birth_date: childRecord.birth_date,
          education_level: childRecord.education_level,
          parent_name: childRecord.parent_name,
          parent_phone: childRecord.parent_phone,
          // Only update notes if they contain address and current notes are empty
        })
        .eq("id", existingChild.id);

      if (updateError) {
        console.error('Error updating child:', updateError);
      }
    } else {
      // Insert new child
      const { error: insertError } = await supabase
        .from("children")
        .insert(childRecord);

      if (insertError) {
        console.error('Error inserting child:', insertError);
      }
    }
  };

  const saveProtocolData = async (isDraft: boolean = false) => {
    // Предотвращаем дублирование сохранения
    if (isSaving) {
      console.log('Already saving, skip duplicate save');
      return;
    }

    // Проверка доступа для новых протоколов (не применяется к админам и региональным операторам)
    if (!editingProtocol && !savedProtocolId && !isAdmin && !isRegionalOperator && !subscriptionStatus.canCreateProtocols) {
      toast({
        title: t('protocolForm.access.restricted'),
        description: t('protocolForm.access.trialEndedShort'),
        variant: "destructive"
      });
      return;
    }

    if (!canSaveProtocol() && !isDraft) {
      toast({
        title: t('protocolForm.common.error'),
        description: t('protocolForm.toasts.fillRequiredChild'),
        variant: "destructive"
      });
      return;
    }

    if (!isDraft && !canFinalizeProtocol()) {
      toast({
        title: t('protocolForm.toasts.notReadyTitle'),
        description: t('protocolForm.toasts.notReadyDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    const completionPercentage = calculateProgress();

    const checklistData = {
      level: selectedLevel,
      blocks: checklistBlocks
    };

    let conclusionData = null;
    if (checklistBlocks.length > 0) {
      const analysis = analyzeProtocolResults(checklistBlocks, calculateBlockScore, selectedLevel);
      const conclusion = generateProtocolConclusion(analysis, formData.childData.fullName, selectedLevel);
      conclusionData = {
        finalGroup: conclusion.finalGroup,
        finalStatus: conclusion.finalStatus,
        specialistAssignments: conclusion.specialistAssignments,
        cpmkRecommendation: conclusion.cpmkRecommendation
      };
    }

    const updatedFormData = {
      ...formData,
      conclusion: conclusionData
    };

    const protocolId = editingProtocol?.id || savedProtocolId;

    const protocolData = {
      child_name: formData.childData.fullName,
      child_birth_date: formData.childData.birthDate || undefined,
      organization_id: formData.childData.educationalOrganization,
      education_level: selectedLevel,
      consultation_type: formData.consultationType,
      consultation_reason: formData.reason,
      ppk_number: protocolId ? (formData.ppkNumber || editingProtocol?.ppk_number) : (formData.ppkNumber || undefined),
      session_topic: formData.sessionTopic || undefined,
      meeting_type: formData.meetingType || 'scheduled',
      protocol_data: updatedFormData,
      checklist_data: checklistData,
      completion_percentage: completionPercentage,
      status: isDraft ? 'draft' : 'completed',
      is_ready: !isDraft
    };

    try {
      if (protocolId) {
        // Обновляем существующий протокол (уже сохранённый черновик или редактируемый)
        await updateProtocol(protocolId, protocolData);
        if (!isDraft) {
          toast({
            title: t('protocolForm.toasts.completedTitle'),
            description: t('protocolForm.toasts.completedDesc', { name: formData.childData.fullName }),
            duration: 8000,
          });
        }
      } else {
        // Создаём новый протокол и сохраняем его ID
        const result = await saveProtocol(protocolData);
        if (result && result.id) {
          setSavedProtocolId(result.id);
          console.log('Saved new protocol with ID:', result.id);
        }
        toast({
          title: isDraft ? t('protocolForm.toasts.draftSaved') : t('protocolForm.toasts.protocolSaved'),
          description: isDraft ? t('protocolForm.toasts.draftChanges') : t('protocolForm.toasts.protocolCreated')
        });
      }

      // Auto-update child data in children table
      if (!isDraft && formData.childData.fullName && formData.childData.educationalOrganization) {
        try {
          await syncChildDataToChildrenTable(formData.childData, selectedLevel, formData.childData.educationalOrganization);
          // Invalidate children queries to refresh the list
          queryClient.invalidateQueries({ queryKey: ["children"] });
          queryClient.invalidateQueries({ queryKey: ["children-from-protocols"] });
        } catch (syncError) {
          console.error('Error syncing child data:', syncError);
          // Don't show error toast, this is a background sync
        }
      }

      initialFormDataRef.current = JSON.stringify(formData);
      setHasUnsavedChanges(false);

      if (!isDraft) {
        setShowCompletionDialog(true);
      }
    } catch (error) {
      console.error('Error saving protocol:', error);
      toast({
        title: t('protocolForm.common.error'),
        description: t('protocolForm.toasts.saveFailed'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateProgress = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Шаг 1: Обязательные поля данных обучающегося
    const requiredChildFields = ['fullName', 'birthDate', 'age', 'classNumber', 'parentName', 'parentPhone', 'whobrought', 'educationalOrganization'];
    requiredChildFields.forEach(field => {
      totalFields++;
      const value = formData.childData[field as keyof ChildData];
      if (value && value !== '') completedFields++;
    });

    // Шаг 2: Обязательные поля протокола
    const requiredProtocolFields = [formData.reason, formData.consultationDate, formData.sessionTopic, formData.meetingType];
    requiredProtocolFields.forEach(field => {
      totalFields++;
      if (field && field.trim() !== '') completedFields++;
    });

    // Шаг 3: Обязательные документы
    const requiredDocs = formData.documents.filter(doc => doc.required);
    requiredDocs.forEach(doc => {
      totalFields++;
      if (doc.present) completedFields++;
    });

    // Шаг 4: Чек-лист обследования
    let checklistTotal = 0;
    let checklistCompleted = 0;
    checklistBlocks.forEach(block => {
      block.topics.forEach((topic: any) => {
        topic.subtopics.forEach((subtopic: any) => {
          subtopic.items.forEach((item: any) => {
            checklistTotal++;
            if (item.score !== undefined && item.score !== null) checklistCompleted++;
          });
        });
      });
    });
    if (checklistTotal > 0) {
      totalFields += checklistTotal;
      completedFields += checklistCompleted;
    }

    // Шаг 5: Согласие родителей
    totalFields++;
    if (formData.parentConsent) completedFields++;
    totalFields++;
    if (formData.parentConsentAcknowledged) completedFields++;

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  };

  // Проверка обязательных полей для каждого шага
  const getStepMissingRequiredFields = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1: {
        const requiredFields = ['fullName', 'birthDate', 'age', 'classNumber', 'gender', 'address', 'parentName', 'parentPhone', 'whobrought', 'educationalOrganization'];
        return requiredFields.some(field => {
          const value = formData.childData[field as keyof ChildData];
          return !value || value === '';
        });
      }
      case 2: {
        return !formData.reason || !formData.consultationDate || !formData.sessionTopic;
      }
      case 3: {
        const requiredDocs = formData.documents.filter(doc => doc.required);
        return requiredDocs.some(doc => !doc.present);
      }
      case 4: {
        // Чек-лист считается заполненным только если:
        // 1. Пользователь нажал "Приступить к заполнению"
        // 2. Все элементы заполнены
        // 3. Пользователь нажал "Подтвердить заполнение"
        if (!formData.checklistStarted) return true; // Не начат
        if (!formData.checklistConfirmed) return true; // Не подтверждён
        
        // Проверяем полноту заполнения
        let hasIncomplete = false;
        checklistBlocks.forEach(block => {
          block.topics.forEach((topic: any) => {
            topic.subtopics.forEach((subtopic: any) => {
              subtopic.items.forEach((item: any) => {
                if (item.score === undefined || item.score === null) {
                  hasIncomplete = true;
                }
              });
            });
          });
        });
        return hasIncomplete;
      }
      case 5: {
        return !formData.parentConsent || !formData.parentConsentAcknowledged;
      }
      default:
        return false;
    }
  };

  // Если доступ истек и это не редактирование существующего протокола
  // Админы и региональные операторы имеют полный доступ
  if (!editingProtocol && !isAdmin && !isRegionalOperator && !subscriptionStatus.canCreateProtocols && !subscriptionStatus.loading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {t('protocolForm.access.restricted')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('protocolForm.access.trialEnded')}
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/profile')} className="flex-1">
              {t('protocolForm.common.subscribe')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              {t('protocolForm.common.toHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { 
      number: 1, 
      title: t('protocolForm.steps.step1'), 
      icon: User,
      isComplete: () => !getStepMissingRequiredFields(1),
      hasMissingRequired: () => getStepMissingRequiredFields(1)
    },
    { 
      number: 2, 
      title: t('protocolForm.steps.step2'), 
      icon: FileText,
      isComplete: () => !getStepMissingRequiredFields(2),
      hasMissingRequired: () => getStepMissingRequiredFields(2)
    },
    { 
      number: 3, 
      title: t('protocolForm.steps.step3'), 
      icon: FileText,
      isComplete: () => !getStepMissingRequiredFields(3),
      hasMissingRequired: () => getStepMissingRequiredFields(3)
    },
    { 
      number: 4, 
      title: t('protocolForm.steps.step4'), 
      icon: ClipboardList,
      isComplete: () => !getStepMissingRequiredFields(4),
      hasMissingRequired: () => getStepMissingRequiredFields(4)
    },
    { 
      number: 5, 
      title: t('protocolForm.steps.step5'), 
      icon: CheckCircle,
      isComplete: () => !getStepMissingRequiredFields(5),
      hasMissingRequired: () => getStepMissingRequiredFields(5)
    },
  ];

  // Блокировка создания нового протокола при отсутствии доступа
  const canCreateNew = editingProtocol || subscriptionStatus.canCreateProtocols;

  return (
    <div className="space-y-6">
      {!canCreateNew && !subscriptionStatus.loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {subscriptionStatus.trialEndDate ? (
              <>
                {t('protocolForm.access.trialEndedOn', { date: subscriptionStatus.trialEndDate.toLocaleDateString('ru-RU') })}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/profile')}
                  className="ml-4"
                >
                  {t('protocolForm.common.subscribe')}
                </Button>
              </>
            ) : (
              <>
                {t('protocolForm.access.subscriptionRequired')}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/profile')}
                  className="ml-4"
                >
                  {t('protocolForm.common.subscribe')}
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('protocolForm.saveDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('protocolForm.saveDialog.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinueWithoutSaving}>
              {t('protocolForm.saveDialog.discard')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndContinue}>
              {t('protocolForm.common.save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог успешного завершения протокола */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              {t('protocolForm.completion.title')}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-lg font-medium text-green-800">
                    {t('protocolForm.completion.savedFor', { name: formData.childData.fullName })}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {t('protocolForm.completion.ready')}
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setShowCompletionDialog(false);
                onProtocolSave(formData);
                navigate('/');
              }}
            >
              {t('protocolForm.completion.goToList')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full mb-6">
        <div className="flex items-center justify-between w-full px-4 gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = step.isComplete();
            const hasMissing = step.hasMissingRequired();
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => handleStepChange(step.number)}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                      ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${isCompleted && !isActive ? 'border-primary bg-primary/10 text-primary' : ''}
                      ${!isActive && !isCompleted && hasMissing ? 'border-destructive text-destructive bg-destructive/10' : ''}
                      ${!isActive && !isCompleted && !hasMissing ? 'border-muted-foreground/30 text-muted-foreground' : ''}
                      hover:scale-105
                    `}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : hasMissing && !isActive ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>
                  <span className={`text-xs mt-1 text-center max-w-[120px] ${isActive ? 'font-semibold' : ''} ${hasMissing && !isActive && !isCompleted ? 'text-destructive' : ''}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    h-0.5 flex-1 mx-2
                    ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Progress value={calculateProgress()} className="h-2" />

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('protocolForm.steps.step1')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Уведомления о подписке - только для пользователей без активной подписки */}
            {!editingProtocol && !isAdmin && !isRegionalOperator && !subscriptionStatus.hasActiveSubscription && (
              <>
                {!subscriptionStatus.canCreateProtocols && !subscriptionStatus.loading && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{t('protocolForm.access.trialEndedShort')}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/profile')}
                      >
                        {t('protocolForm.common.subscribe')}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {subscriptionStatus.isTrialActive && subscriptionStatus.trialEndDate && (
                  (() => {
                    const daysLeft = Math.ceil((subscriptionStatus.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysLeft <= 3 ? (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>{t('protocolForm.access.trialEndingSoon', { days: daysLeft, unit: daysLeft === 1 ? t('protocolForm.access.dayOne') : daysLeft < 5 ? t('protocolForm.access.dayFew') : t('protocolForm.access.dayMany') })}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/profile')}
                          >
                            {t('protocolForm.common.subscribe')}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : null;
                  })()
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="fullName">{t('protocolForm.child.fullName')} *</Label>
                  <ChildSelector
                    onSelect={(child) => {
                      updateChildData("fullName", child.fullName);
                      updateChildData("birthDate", child.birthDate);
                      updateChildData("parentName", child.parentName);
                      updateChildData("parentPhone", child.parentPhone);
                      if (child.birthDate) {
                        const birthDate = parseISO(child.birthDate);
                        const today = new Date();
                        const years = differenceInYears(today, birthDate);
                        const months = differenceInMonths(today, birthDate) % 12;
                        updateChildData("age", t('protocolForm.child.ageFmt', { years, months }));
                      }
                    }}
                  />
                </div>
                <Input
                  id="fullName"
                  value={formData.childData.fullName}
                  onChange={(e) => updateChildData("fullName", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.fullName)}
                  placeholder={t('protocolForm.child.fullNamePh')}
                />
                <FieldError messageKey={childErrorKey("fullName")} />
              </div>

              <div>
                <Label htmlFor="birthDate">{t('protocolForm.child.birthDate')} *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.childData.birthDate}
                  onChange={(e) => {
                    updateChildData("birthDate", e.target.value);
                    if (e.target.value) {
                      const birthDate = parseISO(e.target.value);
                      const today = new Date();
                      const years = differenceInYears(today, birthDate);
                      const months = differenceInMonths(today, birthDate) % 12;
                      updateChildData("age", t('protocolForm.child.ageFmt', { years, months }));
                    }
                  }}
                  className={getRequiredFieldClass(formData.childData.birthDate)}
                />
              </div>

              <div>
                <Label htmlFor="age">{t('protocolForm.child.age')} *</Label>
                <Input
                  id="age"
                  value={formData.childData.age}
                  onChange={(e) => updateChildData("age", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.age)}
                  placeholder={t('protocolForm.child.agePh')}
                />
              </div>

              <div>
                <Label htmlFor="gender">{t('protocolForm.child.gender')} *</Label>
                <Select
                  value={formData.childData.gender}
                  onValueChange={(value) => updateChildData('gender', value)}
                >
                  <SelectTrigger className={getRequiredFieldClass(formData.childData.gender)}>
                    <SelectValue placeholder={t('protocolForm.child.genderPh')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('protocolForm.child.male')}</SelectItem>
                    <SelectItem value="female">{t('protocolForm.child.female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 py-4">
                <Label className="mb-3 block">{t('protocolForm.child.educationLevel')} *</Label>
                <EducationLevelSelector
                  selectedLevel={selectedLevel}
                  onLevelChange={setSelectedLevel}
                />
              </div>

              <div>
                <Label htmlFor="classNumber">{t('protocolForm.child.classGroup')} *</Label>
                <Select
                  value={formData.childData.classNumber}
                  onValueChange={(value) => updateChildData('classNumber', value)}
                >
                  <SelectTrigger className={getRequiredFieldClass(formData.childData.classNumber)}>
                    <SelectValue placeholder={
                      selectedLevel === 'preschool' 
                        ? t('protocolForm.child.selectGroup')
                        : t('protocolForm.child.selectClass')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedLevel === 'preschool' ? (
                      <>
                        <SelectItem value="Младшая группа">{t('protocolForm.child.groupYounger')}</SelectItem>
                        <SelectItem value="Средняя группа">{t('protocolForm.child.groupMiddle')}</SelectItem>
                        <SelectItem value="Старшая группа">{t('protocolForm.child.groupOlder')}</SelectItem>
                        <SelectItem value="Подготовительная группа">{t('protocolForm.child.groupPrep')}</SelectItem>
                      </>
                    ) : (
                      <>
                        {Array.from({ length: 11 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {t('protocolForm.child.classN', { n: i + 1 })}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="classLetter">{t('protocolForm.child.classLetter')}</Label>
                <Input
                  id="classLetter"
                  value={formData.childData.classLetter}
                  onChange={(e) => updateChildData("classLetter", e.target.value)}
                  placeholder={selectedLevel === 'preschool' ? t('protocolForm.child.groupNumberPh') : t('protocolForm.child.letterPh')}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="educationalOrganization">{t('protocolForm.child.organization')} *</Label>
                <OrganizationSelector
                  value={formData.childData.educationalOrganization}
                  onChange={(value) => updateChildData("educationalOrganization", value)}
                  disabled={!isAdmin && !isRegionalOperator && !!profile?.organization_id}
                  label=""
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">{t('protocolForm.child.address')} *</Label>
                <Textarea
                  id="address"
                  value={formData.childData.address}
                  onChange={(e) => updateChildData("address", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.address)}
                  placeholder={t('protocolForm.child.addressPh')}
                  rows={2}
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="sameAsAddress"
                  checked={formData.childData.sameAsAddress || false}
                  onCheckedChange={(checked) => {
                    updateChildData("sameAsAddress", checked === true ? "true" : "false");
                    if (checked) {
                      updateChildData("registrationAddress", formData.childData.address);
                    }
                  }}
                />
                <Label htmlFor="sameAsAddress" className="font-normal cursor-pointer">
                  {t('protocolForm.child.sameAddress')}
                </Label>
              </div>

              {!formData.childData.sameAsAddress && (
                <div className="col-span-2">
                  <Label htmlFor="registrationAddress">{t('protocolForm.child.registrationAddress')}</Label>
                  <Textarea
                    id="registrationAddress"
                    value={formData.childData.registrationAddress}
                    onChange={(e) => updateChildData("registrationAddress", e.target.value)}
                    placeholder={t('protocolForm.child.addressPh')}
                    rows={2}
                  />
                </div>
              )}

              <div className="col-span-2">
                <Label htmlFor="parentName">{t('protocolForm.child.parentName')} *</Label>
                <Input
                  id="parentName"
                  value={formData.childData.parentName}
                  onChange={(e) => updateChildData("parentName", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.parentName)}
                  placeholder={t('protocolForm.child.fullNamePh')}
                />
              </div>

              <div>
                <Label htmlFor="parentPhone">{t('protocolForm.child.parentPhone')} *</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={formData.childData.parentPhone}
                  onChange={(e) => updateChildData("parentPhone", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.parentPhone)}
                  placeholder={t('protocolForm.child.parentPhonePh')}
                />
              </div>

              <div>
                <Label htmlFor="parentEmail">{t('protocolForm.child.parentEmail')}</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={formData.childData.parentEmail}
                  onChange={(e) => updateChildData("parentEmail", e.target.value)}
                  placeholder={t('protocolForm.child.parentEmailPh')}
                />
              </div>

              <div>
                <Label htmlFor="whobrought">{t('protocolForm.child.whobrought')} *</Label>
                <Select
                  value={formData.childData.whobrought}
                  onValueChange={(value) => updateChildData("whobrought", value)}
                >
                  <SelectTrigger className={getRequiredFieldClass(formData.childData.whobrought)}>
                    <SelectValue placeholder={t('protocolForm.common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mother">{t('protocolForm.child.mother')}</SelectItem>
                    <SelectItem value="father">{t('protocolForm.child.father')}</SelectItem>
                    <SelectItem value="guardian">{t('protocolForm.child.guardian')}</SelectItem>
                    <SelectItem value="representative">{t('protocolForm.child.representative')}</SelectItem>
                    <SelectItem value="other">{t('protocolForm.child.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.childData.whobrought === "other" && (
                <div className="col-span-2">
                  <Label htmlFor="relationship">{t('protocolForm.child.relationship')}</Label>
                  <Input
                    id="relationship"
                    value={formData.childData.relationship}
                    onChange={(e) => updateChildData("relationship", e.target.value)}
                    placeholder={t('protocolForm.child.relationshipPh')}
                  />
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('protocolForm.protocol.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="consultationType">{t('protocolForm.protocol.consultationType')} *</Label>
              <RadioGroup
                value={formData.consultationType}
                onValueChange={(value: "primary" | "secondary") =>
                  setFormData(prev => ({ ...prev, consultationType: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="primary" id="primary" />
                  <Label htmlFor="primary">{t('protocolForm.protocol.primary')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="secondary" id="secondary" />
                  <Label htmlFor="secondary">{t('protocolForm.protocol.secondary')}</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.consultationType === "secondary" && previousProtocols.length > 0 && (
              <div>
                <Label>{t('protocolForm.protocol.previousProtocols')}</Label>
                <div className="space-y-2 mt-2">
                  {previousProtocols.map((protocol) => (
                    <div key={protocol.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{t('protocolForm.protocol.protocolNo', { n: protocol.ppk_number || t('protocolForm.protocol.noNumber') })}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(protocol.created_at).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProtocol(protocol);
                          setShowProtocolDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('protocolForm.common.view')}
                      </Button>
                    </div>
                  ))}
                </div>
                <PreviousProtocolDialog
                  protocol={selectedProtocol}
                  open={showProtocolDialog}
                  onOpenChange={setShowProtocolDialog}
                />
              </div>
            )}

            {formData.consultationType === "secondary" && (
              <div>
                <Label htmlFor="previousConsultations">{t('protocolForm.protocol.history')}</Label>
                <Textarea
                  id="previousConsultations"
                  value={formData.previousConsultations}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousConsultations: e.target.value }))}
                  rows={6}
                  placeholder={t('protocolForm.protocol.historyPh')}
                />
              </div>
            )}

            <div>
              <Label htmlFor="consultationDate">{t('protocolForm.protocol.consultationDate')} *</Label>
              <Input
                id="consultationDate"
                type="date"
                value={formData.consultationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, consultationDate: e.target.value }))}
                className={getRequiredFieldClass(formData.consultationDate)}
              />
            </div>

            <div>
              <Label htmlFor="reason">{t('protocolForm.protocol.reason')} *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className={getRequiredFieldClass(formData.reason)}
                placeholder={t('protocolForm.protocol.reasonPh')}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="sessionTopic">{t('protocolForm.protocol.sessionTopic')}</Label>
              <Select
                value={formData.sessionTopic}
                onValueChange={(value) => setFormData({ ...formData, sessionTopic: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('protocolForm.protocol.sessionTopicPh')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Определение необходимости психолого-педагогической помощи">
                    {t('protocolForm.protocol.topic1')}
                  </SelectItem>
                  <SelectItem value="Определение направления психолого-педагогической помощи">
                    {t('protocolForm.protocol.topic2')}
                  </SelectItem>
                  <SelectItem value="Оценка эффективности психолого-педагогической помощи">
                    {t('protocolForm.protocol.topic3')}
                  </SelectItem>
                  <SelectItem value="Психолого-педагогическое сопровождение обучающихся с ОВЗ">
                    {t('protocolForm.protocol.topic4')}
                  </SelectItem>
                  <SelectItem value="Подготовка рекомендаций по АООП">
                    {t('protocolForm.protocol.topic5')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="meetingType">{t('protocolForm.protocol.meetingType')}</Label>
              <Select
                value={formData.meetingType || "scheduled"}
                onValueChange={(value: "scheduled" | "unscheduled") =>
                  setFormData(prev => ({ ...prev, meetingType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t('protocolForm.protocol.scheduled')}</SelectItem>
                  <SelectItem value="unscheduled">{t('protocolForm.protocol.unscheduled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ppkNumber">{t('protocolForm.protocol.ppkNumber')}</Label>
              <Input
                id="ppkNumber"
                value={formData.ppkNumber || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, ppkNumber: e.target.value }))}
                placeholder={t('protocolForm.protocol.ppkNumberPh')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('protocolForm.protocol.ppkNumberHint')}
              </p>
            </div>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('protocolForm.protocol.consentTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background">
                    <Checkbox
                      id="parentConsent"
                      checked={formData.parentConsent || false}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, parentConsent: Boolean(checked) }))
                      }
                    />
                    <Label htmlFor="parentConsent" className="font-normal cursor-pointer">
                      {t('protocolForm.protocol.consentText')}
                    </Label>
                    <Badge variant={formData.parentConsent ? "default" : "secondary"} className="ml-auto">
                      {formData.parentConsent ? t('protocolForm.common.yes') : t('protocolForm.common.no')}
                    </Badge>
                  </div>
                </div>
                
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('protocolForm.documents.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={doc.id}
                      checked={doc.present}
                      onCheckedChange={(checked) => updateDocument(doc.id, Boolean(checked))}
                    />
                    <Label htmlFor={doc.id} className="font-normal cursor-pointer">
                      {t(`protocolForm.documents.${doc.id}`, { defaultValue: doc.name })}
                      {doc.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                  <Badge variant={doc.present ? "default" : "secondary"}>
                    {doc.present ? t('protocolForm.common.present') : t('protocolForm.common.absent')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <ProtocolChecklistPaginated
          educationLevel={selectedLevel}
          childName={formData.childData.fullName}
          blocks={checklistBlocks}
          onItemChange={updateItemScore}
          calculateBlockScore={calculateBlockScore}
          checklistStarted={formData.checklistStarted || false}
          checklistConfirmed={formData.checklistConfirmed || false}
          onChecklistStarted={(started) => setFormData(prev => ({ ...prev, checklistStarted: started }))}
          onChecklistConfirmed={(confirmed) => setFormData(prev => ({ ...prev, checklistConfirmed: confirmed }))}
        />
      )}

      {currentStep === 5 && (
        <div className="space-y-6">
          {/* Результаты */}
          <ProtocolResultsPanel
            blocks={checklistBlocks}
            educationLevel={selectedLevel}
            calculateBlockScore={calculateBlockScore}
          />
          
          {/* Направления помощи */}
          <AssistanceDirectionsPanel
            blocks={checklistBlocks}
            educationLevel={selectedLevel}
            calculateBlockScore={calculateBlockScore}
          />
          
          {/* Заключение */}
          <ProtocolConclusionPanel
            blocks={checklistBlocks}
            educationLevel={selectedLevel}
            childName={formData.childData.fullName}
            calculateBlockScore={calculateBlockScore}
            onConclusionChange={(text) => setFormData(prev => ({ ...prev, conclusionText: text }))}
            savedConclusion={formData.conclusionText}
            parentConsent={formData.parentConsentAcknowledged || false}
            onParentConsentChange={(consent) => setFormData(prev => ({ ...prev, parentConsentAcknowledged: consent }))}
          />
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          onClick={prevStep}
          disabled={currentStep === 1}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('protocolForm.common.back')}
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={() => saveProtocolData(true)}
            variant="outline"
            disabled={!canSaveProtocol()}
          >
            <Save className="mr-2 h-4 w-4" />
            {t('protocolForm.common.saveDraft')}
          </Button>

          {currentStep < 5 ? (
            <Button onClick={nextStep}>
              {t('protocolForm.common.next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => saveProtocolData(false)}
              disabled={!canFinalizeProtocol()}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('protocolForm.common.finalize')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
