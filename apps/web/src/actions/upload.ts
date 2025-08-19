"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function uploadAvatar(formData: FormData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "Пользователь не авторизован" };
    }

    const file = formData.get("avatar") as File;
    
    if (!file) {
      return { error: "Файл не выбран" };
    }

    // Проверяем размер файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { error: "Размер файла не должен превышать 2MB" };
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      return { error: "Файл должен быть изображением" };
    }

    const supabase = await createClient();

    // Генерируем уникальное имя файла
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Загружаем файл в Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return { error: "Ошибка при загрузке файла" };
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Обновляем профиль пользователя
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return { error: "Ошибка при обновлении профиля" };
    }

    revalidatePath("/profile");
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error("Error in uploadAvatar:", error);
    return { error: "Произошла ошибка при загрузке аватара" };
  }
}
