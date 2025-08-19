import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Получаем заголовки
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Получаем тело запроса
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Создаем webhook
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const supabase = await createClient()

  // Обрабатываем события
  switch (evt.type) {
    case 'user.created':
      console.log('User created:', evt.data.id)
      // Создаем профиль пользователя в Supabase
      const { error: createError } = await supabase
        .rpc('sync_clerk_user_profile', {
          clerk_user_id: evt.data.id,
          first_name: evt.data.first_name,
          last_name: evt.data.last_name,
          avatar_url: evt.data.image_url,
        })

      if (createError) {
        console.error('Error creating user profile:', createError)
        return new Response('Error creating user profile', { status: 500 })
      }
      break;
      
    case 'user.updated':
      console.log('User updated:', evt.data.id)
      // Обновляем профиль пользователя
      const { error: updateError } = await supabase
        .rpc('sync_clerk_user_profile', {
          clerk_user_id: evt.data.id,
          first_name: evt.data.first_name,
          last_name: evt.data.last_name,
          avatar_url: evt.data.image_url,
        })

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        return new Response('Error updating user profile', { status: 500 })
      }
      break;
      
    case 'user.deleted':
      console.log('User deleted:', evt.data.id)
      // Удаляем профиль пользователя
      const { error: deleteError } = await supabase
        .rpc('delete_clerk_user_profile', {
          clerk_user_id: evt.data.id
        })

      if (deleteError) {
        console.error('Error deleting user profile:', deleteError)
        return new Response('Error deleting user profile', { status: 500 })
      }
      break;

    default:
      console.log('Unhandled webhook event:', evt.type)
  }

  return new Response('', { status: 200 })
}
