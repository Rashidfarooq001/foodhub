export interface UseMsg91WidgetOptions {
    onSuccess: (accessToken: string) => void;
    onFailure?: (error: any) => void;
    widgetId?: string;
    tokenAuth?: string;
}
export declare function useMsg91Widget(options: UseMsg91WidgetOptions): {
    isScriptLoaded: boolean;
    step: "PHONE" | "OTP";
    setStep: import("react").Dispatch<import("react").SetStateAction<"PHONE" | "OTP">>;
    phone: string;
    setPhone: import("react").Dispatch<import("react").SetStateAction<string>>;
    otp: string[];
    setOtp: import("react").Dispatch<import("react").SetStateAction<string[]>>;
    error: string;
    setError: import("react").Dispatch<import("react").SetStateAction<string>>;
    isLoading: boolean;
    setIsLoading: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    cooldown: number;
    sendOtp: (inputPhone: string) => Promise<boolean>;
    verifyOtp: (inputOtp: string) => Promise<void>;
};
