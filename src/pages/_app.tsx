import "@/client/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/client/context/AuthContext";
import { TrainingDataProvider } from "@/client/context/TrainingPlanData";
import AuthWrapper from "@/client/components/auth/AuthWrapper";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <TrainingDataProvider>
        <AuthWrapper>
          <Component {...pageProps} />
        </AuthWrapper>
      </TrainingDataProvider>
    </AuthProvider>
  );
}
