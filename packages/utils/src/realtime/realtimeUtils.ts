import type { RealtimeChannelConfig, SubscribedChannel } from '@meditime/types';

export interface SupabaseRealtimeClient {
  channel: (name: string) => {
    on: (
      type: string,
      config: Record<string, unknown>,
      callback: () => void | Promise<void>,
    ) => { subscribe: () => SubscribedChannel };
  };
}

export function subscribeRealtimeChannels(
  supabase: SupabaseRealtimeClient,
  channels: readonly RealtimeChannelConfig[],
  onEvent: () => void | Promise<void>,
): SubscribedChannel[] {
  return channels.map(({ channelName, event = '*', schema = 'public', table, filter }) =>
    supabase
      .channel(channelName)
      .on('postgres_changes', { event, schema, table, filter }, () => {
        void onEvent();
      })
      .subscribe(),
  );
}

export function unsubscribeRealtimeChannels(
  channels: SubscribedChannel[],
  onError?: (err: unknown) => void,
): void {
  channels.forEach((ch) => {
    try {
      ch.unsubscribe();
    } catch (err) {
      onError?.(err);
    }
  });
}
