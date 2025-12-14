import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { FUNCTIONS } from "@/lib/func2url";
import { User } from "@/types";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: User & { id: number; token?: string }) => void;
}

export default function AuthDialog({ isOpen, onClose, onAuthSuccess }: AuthDialogProps) {
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsStep, setSmsStep] = useState<"phone" | "code" | "password">("phone");
  const [avatarFile, setAvatarFile] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAuthForm = () => {
    setPhone("");
    setPassword("");
    setUsername("");
    setSmsCode("");
    setAvatarFile("");
    setSmsStep("phone");
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      alert("Введите телефон и пароль");
      return;
    }

    try {
      const data = await api.login(phone, password);

      if (data.error) {
        alert(data.error || "Ошибка входа");
      } else {
        onAuthSuccess({
          ...data,
          avatar: data.avatar,
          status: "",
        });
        onClose();
        setPhone("");
        setPassword("");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Ошибка подключения");
    }
  };

  const handleSendSMS = async () => {
    if (phone.length < 10) {
      alert("Введите корректный номер телефона");
      return;
    }

    try {
      const data = await api.sendSMS(phone);

      if (data.success) {
        setSmsStep("code");
        alert("SMS-код отправлен на ваш телефон!");
      } else {
        alert(data.error || "Ошибка отправки SMS");
      }
    } catch (error) {
      console.error("SMS error:", error);
      alert("Ошибка подключения");
    }
  };

  const handleVerifySMS = async () => {
    if (smsCode.length !== 4) {
      alert("Введите 4-значный код");
      return;
    }

    try {
      const data = await api.verifySMS(phone, smsCode);

      if (data.success) {
        setSmsStep("password");
        setSmsCode("");
      } else {
        alert(data.error || "Неверный код");
      }
    } catch (error) {
      console.error("Verify error:", error);
      alert("Ошибка подключения");
    }
  };

  const handleRegister = async () => {
    if (!username || !password || password.length < 6) {
      alert("Введите имя и пароль (минимум 6 символов)");
      return;
    }

    let latitude = null;
    let longitude = null;
    let city = "";

    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          },
        );
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;

        try {
          const geoResponse = await fetch(
            `${FUNCTIONS["geocode"]}?lat=${latitude}&lon=${longitude}`,
          );
          const geoData = await geoResponse.json();
          city = geoData.city || "";
        } catch (e) {
          console.log("Не удалось определить город");
        }
      }
    } catch (geoError) {
      console.log("Геолокация недоступна:", geoError);
    }

    try {
      const response = await fetch(FUNCTIONS["register"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          username,
          password,
          avatar:
            avatarFile ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          latitude,
          longitude,
          city,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        onAuthSuccess({
          ...data,
          status: "",
        });
        onClose();
        resetAuthForm();
      } else {
        alert(data.error || "Ошибка регистрации");
      }
    } catch (error) {
      console.error("Register error:", error);
      alert("Ошибка подключения");
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      alert("Введите новый пароль (минимум 6 символов)");
      return;
    }

    try {
      const response = await fetch(FUNCTIONS["reset-password"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, new_password: password }),
      });
      const data = await response.json();

      if (response.ok) {
        alert("Пароль успешно изменён! Теперь войдите с новым паролем.");
        setAuthMode("login");
        resetAuthForm();
      } else {
        alert(data.error || "Ошибка сброса пароля");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Ошибка подключения");
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon
              name={
                authMode === "login"
                  ? "LogIn"
                  : authMode === "register"
                  ? "UserPlus"
                  : "KeyRound"
              }
              size={20}
            />
            {authMode === "login" && "Вход"}
            {authMode === "register" && "Регистрация"}
            {authMode === "reset" && "Восстановление пароля"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {authMode === "login" && (
            <>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Войти
              </Button>
              <div className="text-center space-y-2">
                <button
                  onClick={() => setAuthMode("register")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Нет аккаунта? Зарегистрируйтесь
                </button>
                <br />
                <button
                  onClick={() => {
                    setAuthMode("reset");
                    setSmsStep("phone");
                  }}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>
            </>
          )}

          {authMode === "register" && (
            <>
              <div>
                <Label htmlFor="username">Имя</Label>
                <Input
                  id="username"
                  placeholder="Ваше имя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Пароль (мин. 6 символов)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="avatar">Аватар (опционально)</Label>
                <Input
                  ref={fileInputRef}
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                />
              </div>
              <Button onClick={handleRegister} className="w-full">
                Зарегистрироваться
              </Button>
              <div className="text-center">
                <button
                  onClick={() => setAuthMode("login")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Уже есть аккаунт? Войдите
                </button>
              </div>
            </>
          )}

          {authMode === "reset" && (
            <>
              {smsStep === "phone" && (
                <>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSendSMS} className="w-full">
                    Отправить SMS-код
                  </Button>
                </>
              )}

              {smsStep === "code" && (
                <>
                  <div>
                    <Label htmlFor="smsCode">Код из SMS</Label>
                    <Input
                      id="smsCode"
                      placeholder="1234"
                      maxLength={4}
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleVerifySMS} className="w-full">
                    Проверить код
                  </Button>
                </>
              )}

              {smsStep === "password" && (
                <>
                  <div>
                    <Label htmlFor="newPassword">Новый пароль</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleResetPassword} className="w-full">
                    Сменить пароль
                  </Button>
                </>
              )}

              <div className="text-center">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    resetAuthForm();
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Вернуться ко входу
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
