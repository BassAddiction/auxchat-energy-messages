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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Icon from "@/components/ui/icon";
import { FUNCTIONS } from "@/lib/func2url";
import { User } from "@/types";

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  userId: number;
  profilePhotos: { id: number; url: string }[];
  onUserUpdate: (user: User) => void;
  onPhotosUpdate: (photos: { id: number; url: string }[]) => void;
  onAddEnergy: () => void;
}

export default function ProfileDialog({
  isOpen,
  onClose,
  user,
  userId,
  profilePhotos,
  onUserUpdate,
  onPhotosUpdate,
  onAddEnergy,
}: ProfileDialogProps) {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const response = await fetch(
        `${FUNCTIONS["profile-photos"]}?photoId=${photoId}`,
        {
          method: "DELETE",
          headers: { "X-User-Id": userId.toString() },
        },
      );

      if (response.ok) {
        onPhotosUpdate(profilePhotos.filter((p) => p.id !== photoId));
      }
    } catch (error) {
      console.error("Delete photo error:", error);
    }
  };

  const handleAddPhoto = async () => {
    if (!photoUrl.trim()) return;

    try {
      const response = await fetch(FUNCTIONS["profile-photos"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({ photo_url: photoUrl.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        onPhotosUpdate([...profilePhotos, { id: data.id, url: photoUrl.trim() }]);
        setPhotoUrl("");
        setIsAddingPhoto(false);
      }
    } catch (error) {
      console.error("Add photo error:", error);
    }
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgress("Подготовка...");

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const uploadResponse = await fetch(
        `${FUNCTIONS["generate-upload-url"]}?contentType=${encodeURIComponent(file.type)}&extension=${extension}`,
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress("Загрузка файла...");

      const uploadFileResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setUploadProgress("Сохранение...");

      const addResponse = await fetch(FUNCTIONS["profile-photos"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({ photo_url: uploadData.cdnUrl }),
      });

      if (addResponse.ok) {
        const data = await addResponse.json();
        onPhotosUpdate([...profilePhotos, { id: data.id, url: uploadData.cdnUrl }]);
        setUploadProgress("Готово!");
        setTimeout(() => {
          setUploadingFile(false);
          setUploadProgress("");
        }, 1000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Ошибка загрузки фото");
      setUploadingFile(false);
      setUploadProgress("");
    }
  };

  const openPhotoViewer = (index: number) => {
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="User" size={20} />
              Профиль
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditingUsername ? (
                  <div className="flex gap-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Новое имя"
                    />
                    <Button size="sm" onClick={() => setIsEditingUsername(false)}>
                      <Icon name="Check" size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{user?.username}</h3>
                  </div>
                )}
                <p className="text-sm text-gray-600">{user?.phone}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label>Статус</Label>
                {!isEditingStatus && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewStatus(user?.status || "");
                      setIsEditingStatus(true);
                    }}
                  >
                    <Icon name="Edit" size={14} />
                  </Button>
                )}
              </div>
              {isEditingStatus ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="Ваш статус"
                    maxLength={100}
                  />
                  <Button size="sm" onClick={() => setIsEditingStatus(false)}>
                    <Icon name="Check" size={16} />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-700 mt-1">
                  {user?.status || "Статус не установлен"}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Фотографии ({profilePhotos.length}/6)</Label>
                {!isAddingPhoto && profilePhotos.length < 6 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingPhoto(true)}
                  >
                    <Icon name="Plus" size={16} />
                  </Button>
                )}
              </div>

              {isAddingPhoto && (
                <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded">
                  <Input
                    placeholder="URL фотографии"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  <div className="text-sm text-gray-600 text-center">или</div>
                  <Input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileUpload}
                    disabled={uploadingFile}
                  />
                  {uploadingFile && (
                    <p className="text-sm text-blue-600">{uploadProgress}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddPhoto}
                      disabled={!photoUrl.trim() || uploadingFile}
                      className="flex-1"
                    >
                      Добавить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingPhoto(false);
                        setPhotoUrl("");
                      }}
                      disabled={uploadingFile}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {profilePhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt="Profile"
                      className="w-full aspect-square object-cover rounded cursor-pointer"
                      onClick={() => openPhotoViewer(index)}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Энергия</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <Icon name="Zap" size={16} />
                  {user?.energy || 0}
                </span>
              </div>
              <Button onClick={onAddEnergy} className="w-full" size="sm">
                <Icon name="Zap" size={16} className="mr-2" />
                Пополнить энергию
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-3xl p-0">
          <div className="relative">
            <img
              src={profilePhotos[currentPhotoIndex]?.url}
              alt="Full size"
              className="w-full max-h-[80vh] object-contain"
            />
            {profilePhotos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setCurrentPhotoIndex((prev) =>
                      prev > 0 ? prev - 1 : profilePhotos.length - 1,
                    )
                  }
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setCurrentPhotoIndex((prev) =>
                      prev < profilePhotos.length - 1 ? prev + 1 : 0,
                    )
                  }
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}