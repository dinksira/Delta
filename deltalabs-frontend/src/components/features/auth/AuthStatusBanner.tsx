import { StatusBanner } from "@/components/theme";

type AuthStatusBannerType = "success" | "error" | "info";

type AuthStatusBannerProps = Readonly<{
  type: AuthStatusBannerType;
  message: string;
}>;

const TYPE_STYLES: Record<AuthStatusBannerType, string> = {
  success: "bg-auth-banner-success-bg text-auth-banner-success-text",
  error: "bg-auth-banner-error-bg text-auth-banner-error-text",
  info: "bg-auth-banner-info-bg text-auth-banner-info-text",
};

const TYPE_SYMBOLS: Record<AuthStatusBannerType, string> = {
  success: "OK",
  error: "!",
  info: "i",
};

export function AuthStatusBanner({ type, message }: AuthStatusBannerProps) {
  return <StatusBanner type={type} message={message} typeStyles={TYPE_STYLES} symbols={TYPE_SYMBOLS} />;
}
