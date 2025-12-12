import { useState, useRef } from 'react';

export interface Message {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  text: string;
  timestamp: Date;
  reactions: { emoji: string; count: number }[];
}

export interface User {
  username: string;
  avatar: string;
  phone: string;
  energy: number;
  status?: string;
}

export const useIndexState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<number | null>(() => {
    const appVersion = localStorage.getItem("app_version");
    console.log("[INIT] App version:", appVersion);
    if (appVersion !== "v3") {
      console.log("[INIT] Version mismatch, clearing localStorage");
      localStorage.clear();
      localStorage.setItem("app_version", "v3");
      localStorage.setItem("auxchat_user_id", "7");
      localStorage.setItem("username", "AuxChat");
      console.log("[INIT] Set default userId to 7");
      return 7;
    }

    const stored = localStorage.getItem("auxchat_user_id");
    console.log("[INIT] Stored userId from localStorage:", stored);
    if (stored && stored !== "null") {
      const parsed = parseInt(stored);
      console.log("[INIT] Parsed userId:", parsed);
      return parsed;
    }

    console.log("[INIT] No valid userId, setting to 7");
    localStorage.setItem("auxchat_user_id", "7");
    localStorage.setItem("username", "AuxChat");
    return 7;
  });

  console.log("[COMPONENT] Rendering with userId:", userId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsStep, setSmsStep] = useState<"phone" | "code" | "password">("phone");
  const [avatarFile, setAvatarFile] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [profilePhotos, setProfilePhotos] = useState<{ id: number; url: string }[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [displayLimit, setDisplayLimit] = useState(() => {
    return window.innerWidth >= 768 ? 7 : 6;
  });
  const initialLimit = window.innerWidth >= 768 ? 7 : 6;
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);

  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscribedUsers, setSubscribedUsers] = useState<Set<number>>(new Set());
  const subscribedUsersRef = useRef<Set<number>>(new Set());
  const [newSubscribedMessages, setNewSubscribedMessages] = useState(0);
  const lastCheckedMessageIdRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [geoRadius, setGeoRadius] = useState<number>(() => {
    const stored = localStorage.getItem("geo_radius");
    return stored ? parseInt(stored) : 100;
  });
  const [geoRadiusModalOpen, setGeoRadiusModalOpen] = useState(false);
  const [energyAmount, setEnergyAmount] = useState(500);

  const [geoPermissionModalOpen, setGeoPermissionModalOpen] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"sbp" | "sberPay" | "tPay" | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
    city: string;
  } | null>(null);

  return {
    user, setUser,
    userId, setUserId,
    messages, setMessages,
    messageText, setMessageText,
    isAuthOpen, setIsAuthOpen,
    authMode, setAuthMode,
    username, setUsername,
    phone, setPhone,
    password, setPassword,
    smsCode, setSmsCode,
    smsStep, setSmsStep,
    avatarFile, setAvatarFile,
    fileInputRef,
    showProfile, setShowProfile,
    isEditingUsername, setIsEditingUsername,
    newUsername, setNewUsername,
    isEditingStatus, setIsEditingStatus,
    newStatus, setNewStatus,
    profilePhotos, setProfilePhotos,
    photoUrl, setPhotoUrl,
    isAddingPhoto, setIsAddingPhoto,
    uploadingFile, setUploadingFile,
    uploadProgress, setUploadProgress,
    viewerOpen, setViewerOpen,
    currentPhotoIndex, setCurrentPhotoIndex,
    photoFileInputRef,
    displayLimit, setDisplayLimit,
    initialLimit,
    unreadCount, setUnreadCount,
    prevUnreadRef,
    subscriptionModalOpen, setSubscriptionModalOpen,
    selectedUserId, setSelectedUserId,
    selectedUsername, setSelectedUsername,
    isSubscribed, setIsSubscribed,
    checkingSubscription, setCheckingSubscription,
    subscribedUsers, setSubscribedUsers,
    subscribedUsersRef,
    newSubscribedMessages, setNewSubscribedMessages,
    lastCheckedMessageIdRef,
    messagesEndRef,
    prevMessagesLengthRef,
    geoRadius, setGeoRadius,
    geoRadiusModalOpen, setGeoRadiusModalOpen,
    energyAmount, setEnergyAmount,
    geoPermissionModalOpen, setGeoPermissionModalOpen,
    updatingLocation, setUpdatingLocation,
    paymentMethodModalOpen, setPaymentMethodModalOpen,
    selectedPaymentMethod, setSelectedPaymentMethod,
    userLocation, setUserLocation,
  };
};
