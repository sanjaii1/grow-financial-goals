
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface AvatarUploadProps {
  session: Session | null;
  url: string | null;
  onUrlChange: (url: string) => void;
  fallbackText: string;
}

export function AvatarUpload({ session, url, onUrlChange, fallbackText }: AvatarUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const user = session?.user;
      if (!user) {
        throw new Error('User not found.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }

      onUrlChange(newUrl);
      toast({ title: 'Avatar updated successfully!' });
    } catch (error: any) {
      toast({ title: 'Error uploading avatar', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group w-24 h-24 mb-4">
      <Avatar className="w-24 h-24">
        <AvatarImage src={url ?? undefined} alt="Avatar" className="object-cover" />
        <AvatarFallback className="text-3xl">{fallbackText}</AvatarFallback>
      </Avatar>
      <label
        htmlFor="avatar-upload"
        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <Camera className="w-8 h-8 text-white" />
        )}
        <input
          className="hidden"
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
