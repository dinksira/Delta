/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useMutation } from "@tanstack/react-query";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { authApi } from "@/modules/Auth/api/authApi";
import { authMutationKeys } from "@/modules/Auth/hooks/authMutationKeys";
import type {
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
  LoginInput,
  RecoverRequestInput,
  ResetPasswordInput,
  SignupInput,
} from "@/modules/Auth/types/auth";

export function useLoginMutation() {
  const { establishSession } = useAuthSession();
  return useMutation({
    mutationKey: authMutationKeys.login,
    mutationFn: async (input: LoginInput) => {
      const result = await authApi.login(input);
      if (result.session) establishSession(result.session);
      return result;
    },
  });
}

export function useSignupMutation() {
  const { establishSession } = useAuthSession();
  return useMutation({
    mutationKey: authMutationKeys.signup,
    mutationFn: async (input: SignupInput) => {
      const result = await authApi.signup(input);
      if (result.session) establishSession(result.session);
      return result;
    },
  });
}

export function useRecoverRequestMutation() {
  return useMutation({
    mutationKey: authMutationKeys.recover,
    mutationFn: (input: RecoverRequestInput) => authApi.requestRecover(input),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationKey: authMutationKeys.resetPassword,
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input),
  });
}
/** ################################ /COMPONENT ############################# */
