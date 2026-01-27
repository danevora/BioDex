"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebouncedSearch, SearchUser } from "@/hooks/useSearchUsers";
import { FollowButton } from "@/components/profile";

function getInitials(username: string | null): string {
  if (!username) return "?";
  return username.substring(0, 2).toUpperCase();
}

interface SearchResultItemProps {
  user: SearchUser;
  onNavigate: () => void;
}

function SearchResultItem({ user, onNavigate }: SearchResultItemProps) {
  const router = useRouter();

  const handleClick = () => {
    onNavigate();
    router.push(`/profile/${user.id}`);
  };

  return (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-muted/50 rounded-md">
      <button
        onClick={handleClick}
        className="flex items-center gap-3 flex-1 text-left min-w-0"
      >
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user.image || undefined} alt={user.username || "User"} />
          <AvatarFallback className="text-xs">
            {getInitials(user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">
            @{user.username || "Explorer"}
          </p>
        </div>
      </button>
      <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
        <FollowButton
          userId={user.id}
          initialIsFollowing={user.isFollowing}
          initialFollowerCount={user.followerCount}
        />
      </div>
    </div>
  );
}

interface SearchInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onClear?: () => void;
  placeholder?: string;
}

function SearchInput({
  inputValue,
  setInputValue,
  inputRef,
  onClear,
  placeholder = "Search Explorers...",
}: SearchInputProps) {
  const handleClear = () => {
    setInputValue("");
    onClear?.();
    inputRef?.current?.focus();
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

interface SearchResultsProps {
  isLoading: boolean;
  users: SearchUser[] | undefined;
  debouncedValue: string;
  onNavigate: () => void;
}

function SearchResults({
  isLoading,
  users,
  debouncedValue,
  onNavigate,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (debouncedValue.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Type at least 2 characters to search
      </p>
    );
  }

  if (!users || users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No Explorers found
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {users.map((user) => (
        <SearchResultItem key={user.id} user={user} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// Mobile search with popover
function MobileExplorerSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { inputValue, setInputValue, debouncedValue, data, isLoading } =
    useDebouncedSearch();

  const handleClose = () => {
    setOpen(false);
    setInputValue("");
  };

  // Focus input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search Explorers</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <SearchInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          inputRef={inputRef}
          onClear={() => inputRef.current?.focus()}
        />
        <div className="mt-3 max-h-[300px] overflow-y-auto">
          <SearchResults
            isLoading={isLoading}
            users={data?.users}
            debouncedValue={debouncedValue}
            onNavigate={handleClose}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Desktop search with inline results
function DesktopExplorerSearch() {
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { inputValue, setInputValue, debouncedValue, data, isLoading } =
    useDebouncedSearch();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClear = () => {
    setShowResults(false);
  };

  const handleNavigate = () => {
    setShowResults(false);
    setInputValue("");
  };

  return (
    <div ref={containerRef} className="relative w-64">
      <SearchInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        inputRef={inputRef}
        onClear={handleClear}
      />
      {/* Show results dropdown when input is focused and has value */}
      {showResults || inputValue.length > 0 ? (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 p-3 max-h-[400px] overflow-y-auto"
          onFocus={() => setShowResults(true)}
        >
          <SearchResults
            isLoading={isLoading}
            users={data?.users}
            debouncedValue={debouncedValue}
            onNavigate={handleNavigate}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ExplorerSearch() {
  return (
    <>
      {/* Mobile: Icon button with popover */}
      <div className="md:hidden">
        <MobileExplorerSearch />
      </div>
      {/* Desktop: Inline search input */}
      <div className="hidden md:block">
        <DesktopExplorerSearch />
      </div>
    </>
  );
}
