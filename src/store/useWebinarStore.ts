import { CtaTypeEnum } from "@prisma/client";
import { create } from "zustand";
import {
  validateBasicInfo,
  validateCTA,
  validateAdditionalInfo,
  ValidationErrors,
  validationResult,
} from "@/lib/types";

export type WebinarFormState = {
  basicInfo: {
    webinarName?: string;
    description?: string;
    date?: Date;
    time?: string;
    timeFormat?: "AM" | "PM";
  };
  cta: {
    ctaLabel?: string;
    tags?: string[];
    ctaType?: CtaTypeEnum;
    aiAgent?: string;
    priceId?: string;
  };
  additionalInfo: {
    lockChat?: boolean;
    couponCode?: string;
    couponEnabled?: boolean;
  };
};

type ValidationState = {
  basicInfo: {
    valid: boolean;
    errors: ValidationErrors;
  };
  cta: {
    valid: boolean;
    errors: ValidationErrors;
  };
  additionalInfo: {
    valid: boolean;
    errors: ValidationErrors;
  };
};

type WebinarStore = {
  isModalOpen: boolean;
  isComplete: boolean;
  isSubmitting: boolean;
  formData: WebinarFormState;
  validation: ValidationState;

  setModalOpen: (open: boolean) => void;
  setComplete: (complete: boolean) => void;
  setSubmitting: (submitting: boolean) => void;

  updateBasicInfoField: <K extends keyof WebinarFormState["basicInfo"]>(
    field: K,
    value: WebinarFormState["basicInfo"][K]
  ) => void;

  updateCtaField: <K extends keyof WebinarFormState["cta"]>(
    field: K,
    value: WebinarFormState["cta"][K]
  ) => void;

  updateAdditionalInfoField: <
    K extends keyof WebinarFormState["additionalInfo"]
  >(
    field: K,
    value: WebinarFormState["additionalInfo"][K]
  ) => void;

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  validateStep: (step: keyof WebinarFormState) => boolean;
  getStepValidationErrors: (stepId: keyof WebinarFormState) => ValidationErrors;

  resetForm: () => void;
};

const initialState: WebinarFormState = {
  basicInfo: {
    webinarName: "",
    description: "",
    date: undefined,
    time: "",
    timeFormat: "AM",
  },
  cta: {
    ctaLabel: "",
    tags: [],
    ctaType: "BOOK_A_CALL",
    aiAgent: "",
    priceId: "",
  },
  additionalInfo: {
    lockChat: false,
    couponCode: "",
    couponEnabled: false,
  },
};

const initialValidation: ValidationState = {
  basicInfo: { valid: false, errors: {} },
  cta: { valid: false, errors: {} },
  additionalInfo: { valid: true, errors: {} },
};

export const useWebinarStore = create<WebinarStore>((set, get) => ({
  isModalOpen: false,
  isComplete: false,
  isSubmitting: false,
  formData: initialState,
  validation: initialValidation,

  setModalOpen: (open: boolean) => set({ isModalOpen: open }),
  setComplete: (complete: boolean) => set({ isComplete: complete }),
  setSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),

  updateBasicInfoField: (field, value) => {
    set((state) => {
      const newBasicInfo = { ...state.formData.basicInfo, [field]: value };
      const validationResults = validateBasicInfo(newBasicInfo);

      return {
        formData: { ...state.formData, basicInfo: newBasicInfo },
        validation: { ...state.validation, basicInfo: validationResults },
      };
    });
  },

  updateCtaField: (field, value) => {
    set((state) => {
      const newCta = { ...state.formData.cta, [field]: value };
      const validationResults = validateCTA(newCta);

      return {
        formData: { ...state.formData, cta: newCta },
        validation: { ...state.validation, cta: validationResults },
      };
    });
  },

  updateAdditionalInfoField: (field, value) => {
    set((state) => {
      const newAdditionalInfo = {
        ...state.formData.additionalInfo,
        [field]: value,
      };
      const validationResults = validateAdditionalInfo(newAdditionalInfo);

      return {
        formData: { ...state.formData, additionalInfo: newAdditionalInfo },
        validation: { ...state.validation, additionalInfo: validationResults },
      };
    });
  },

  addTag: (tag: string) => {
    set((state) => {
      const newTags = state.formData.cta.tags
        ? [...state.formData.cta.tags, tag]
        : [tag];
      const newCTA = { ...state.formData.cta, tags: newTags };

      return {
        formData: { ...state.formData, cta: newCTA },
      };
    });
  },

  removeTag: (tagToRemove: string) => {
    set((state) => {
      const newTags =
        state.formData.cta.tags?.filter((tag) => tag !== tagToRemove) || [];
      const newCTA = { ...state.formData.cta, tags: newTags };

      return {
        formData: { ...state.formData, cta: newCTA },
      };
    });
  },

  validateStep: (stepId: keyof WebinarFormState) => {
    const { formData } = get();
    let validationResults: validationResult;

    switch (stepId) {
      case "basicInfo":
        validationResults = validateBasicInfo(formData.basicInfo);
        break;
      case "cta":
        validationResults = validateCTA(formData.cta);
        break;
      case "additionalInfo":
        validationResults = validateAdditionalInfo(formData.additionalInfo);
        break;
      default:
        return false;
    }

    set((state) => ({
      validation: {
        ...state.validation,
        [stepId]: validationResults,
      },
    }));

    return validationResults.valid;
  },

  getStepValidationErrors: (stepId: keyof WebinarFormState) => {
    const { validation } = get();
    return validation[stepId].errors;
  },

  resetForm: () => {
    set({
      isComplete: false,
      isSubmitting: false,
      formData: initialState,
      validation: initialValidation,
    });
  },
}));
