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

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: {
    id: number;
    username: string;
    avatar: string;
    phone: string;
    energy: number;
  }) => void;
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
        onAuthSuccess(data);
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
        onAuthSuccess(data);
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
      console.error("Reset error:", error);
      alert("Ошибка подключения");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {authMode === "login"
              ? "Вход"
              : authMode === "register"
                ? "Регистрация"
                : "Сброс пароля"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {authMode === "login" ? (
            <>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7"
                />
              </div>
              <div>
                <Label>Пароль</Label>
                <Input
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
                  onClick={() => {
                    setAuthMode("register");
                    resetAuthForm();
                  }}
                  className="text-sm text-blue-600 hover:underline block w-full"
                >
                  Зарегистрироваться
                </button>
                <button
                  onClick={() => {
                    setAuthMode("reset");
                    resetAuthForm();
                  }}
                  className="text-sm text-gray-600 hover:underline block w-full"
                >
                  Забыли пароль?
                </button>
              </div>
            </>
          ) : authMode === "register" ? (
            <>
              {smsStep === "phone" && (
                <>
                  <div>
                    <Label>Телефон</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7"
                    />
                  </div>
                  <Button onClick={handleSendSMS} className="w-full">
                    Получить SMS-код
                  </Button>
                </>
              )}

              {smsStep === "code" && (
                <>
                  <div>
                    <Label>Код из SMS</Label>
                    <Input
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      maxLength={4}
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
                    <Label>Имя пользователя</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Пароль</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Аватар (опционально)</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Icon name="Upload" className="mr-2" size={16} />
                      Загрузить фото
                    </Button>
                    {avatarFile && (
                      <img
                        src={avatarFile}
                        alt="Preview"
                        className="mt-2 w-20 h-20 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <Button onClick={handleRegister} className="w-full">
                    Зарегистрироваться
                  </Button>
                </>
              )}

              <button
                onClick={() => {
                  setAuthMode("login");
                  resetAuthForm();
                }}
                className="text-sm text-blue-600 hover:underline w-full text-center"
              >
                Уже есть аккаунт? Войти
              </button>
            </>
          ) : (
            <>
              {smsStep === "phone" && (
                <>
                  <div>
                    <Label>Телефон</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7"
                    />
                  </div>
                  <Button onClick={handleSendSMS} className="w-full">
                    Получить SMS-код
                  </Button>
                </>
              )}

              {smsStep === "code" && (
                <>
                  <div>
                    <Label>Код из SMS</Label>
                    <Input
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      maxLength={4}
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
                    <Label>Новый пароль</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleResetPassword} className="w-full">
                    Изменить пароль
                  </Button>
                </>
              )}

              <button
                onClick={() => {
                  setAuthMode("login");
                  resetAuthForm();
                }}
                className="text-sm text-blue-600 hover:underline w-full text-center"
              >
                Вернуться ко входу
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
