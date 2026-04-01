import { useState } from "react";

import { ApiError } from "@/lib/apiClient";
import { authApi } from "@/modules/Feed/api/authApi";
import type {
  AuthResult,
  LoginInput,
  RecoverRequestInput,
  ResetPasswordInput,
  SignupInput,
} from "@/modules/Feed/types/auth";

type MutationState = Readonly<{
  isLoading: boolean;
  error: string | null;
}>;

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed. Please try again.";
}

export function useLoginMutation() {
  const [state, setState] = useState<MutationState>({ isLoading: false, error: null });

  const mutateAsync = async (input: LoginInput): Promise<AuthResult> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await authApi.login(input);
      setState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const message = toErrorMessage(error);
      setState({ isLoading: false, error: message });
      throw error;
    }
  };

  return { ...state, mutateAsync };
}

export function useSignupMutation() {
  const [state, setState] = useState<MutationState>({ isLoading: false, error: null });

  const mutateAsync = async (input: SignupInput): Promise<AuthResult> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await authApi.signup(input);
      setState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const message = toErrorMessage(error);
      setState({ isLoading: false, error: message });
      throw error;
    }
  };

  return { ...state, mutateAsync };
}

export function useRecoverRequestMutation() {
  const [state, setState] = useState<MutationState>({ isLoading: false, error: null });

  const mutateAsync = async (input: RecoverRequestInput): Promise<AuthResult> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await authApi.requestRecover(input);
      setState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const message = toErrorMessage(error);
      setState({ isLoading: false, error: message });
      throw error;
    }
  };

  return { ...state, mutateAsync };
}

export function useResetPasswordMutation() {
  const [state, setState] = useState<MutationState>({ isLoading: false, error: null });

  const mutateAsync = async (input: ResetPasswordInput): Promise<AuthResult> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await authApi.resetPassword(input);
      setState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const message = toErrorMessage(error);
      setState({ isLoading: false, error: message });
      throw error;
    }
  };

  return { ...state, mutateAsync };
}
