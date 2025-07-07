"use client";
import { useAuth } from "../context/AuthContext";
import Chatbot from "./Chatbot";

export default function ChatbotWrapper() {
  const { user } = useAuth();
  if (!user) return null;
  return <Chatbot />;
} 