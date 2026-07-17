import React, { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadUserAvatar } from "@/hooks/use-users";

interface AvatarUploadProps {
  userId: string;
  avatarUrl?: string | null;
  initials: string;
  className?: string;
  onSuccess?: () => void;
}

export function AvatarUpload({ userId, avatarUrl, initials, className, onSuccess }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadUserAvatar();
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await uploadAvatar.mutateAsync({ id: userId, file });
    if (onSuccess) onSuccess();
  };

  return (
    <div
      className={cn("relative cursor-pointer group", className)}
      onClick={() => fileInputRef.current?.click()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-full w-full">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>

      <div className={cn(
        "absolute inset-0 rounded-full flex items-center justify-center bg-black/40 transition-opacity",
        isHovered ? "opacity-100" : "opacity-0",
        uploadAvatar.isPending ? "opacity-100 bg-black/60" : ""
      )}>
        {uploadAvatar.isPending ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Camera className="h-6 w-6 text-white" />
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}
