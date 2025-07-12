import { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando perfil...</div>}>
      <ProfileClient />
    </Suspense>
  );
} 