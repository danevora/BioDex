"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateProfile, UserProfile } from "@/hooks/useUserProfile";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MAX_BIO_LENGTH = 160;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function getInitials(username: string | null, email: string | null): string {
  if (username) return username.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

interface FormErrors {
  username?: string;
  bio?: string;
  image?: string;
}

interface ProfileEditFormProps {
  profile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

function ProfileEditForm({ profile, onSuccess, onCancel }: ProfileEditFormProps) {
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Only JPEG, PNG, WebP, and GIF are allowed" }));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 5MB" }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: undefined }));
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (username.trim()) {
      if (!USERNAME_REGEX.test(username)) {
        newErrors.username =
          "Username must be 3-20 characters, alphanumeric and underscores only";
      }
    }

    // Bio validation
    if (bio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `Bio must be ${MAX_BIO_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        ...(imageFile && { image: imageFile }),
      });

      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        // Check for username conflict error
        if (error.message.includes("Username already taken")) {
          setErrors((prev) => ({ ...prev, username: "Username already taken" }));
        } else {
          setApiError(error.message);
        }
      } else {
        setApiError("An error occurred while saving. Please try again.");
      }
    }
  };

  const isLoading = updateProfile.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {apiError}
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
        >
          <Avatar className="h-20 w-20">
            <AvatarImage src={imagePreview || profile.image || undefined} />
            <AvatarFallback className="text-lg">
              {getInitials(profile.username, profile.email)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageSelect}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">Click to change photo</p>
        {errors.image && (
          <p className="text-xs text-red-600">{errors.image}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Username
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            disabled={isLoading}
            className="w-full pl-8 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
            placeholder="username"
          />
        </div>
        {errors.username ? (
          <p className="mt-1 text-xs text-red-600">{errors.username}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            3-20 characters, letters, numbers, and underscores only
          </p>
        )}
      </div>

      {/* Email (read-only) */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={profile.email || ""}
          disabled
          className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            if (errors.bio) {
              setErrors((prev) => ({ ...prev, bio: undefined }));
            }
          }}
          disabled={isLoading}
          maxLength={MAX_BIO_LENGTH}
          rows={3}
          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 resize-none"
          placeholder="Tell us about yourself..."
        />
        {errors.bio ? (
          <p className="mt-1 text-xs text-red-600">{errors.bio}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {bio.length}/{MAX_BIO_LENGTH}
          </p>
        )}
      </div>

      <DialogFooter className="flex flex-row justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>

    </form>
  );
}

export function ProfileEditModal({
  open,
  onOpenChange,
  profile,
}: ProfileEditModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your profile information. Your username must be unique.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ProfileEditForm
            profile={profile}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
