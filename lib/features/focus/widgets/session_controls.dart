import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/timer_provider.dart';

class SessionControls extends ConsumerWidget {
  const SessionControls({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timerState = ref.watch(timerProvider);
    final notifier = ref.read(timerProvider.notifier);
    
    final isRunning = timerState.status == TimerStatus.running;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton.filledTonal(
          onPressed: () => notifier.reset(),
          icon: const Icon(LucideIcons.rotateCcw),
          iconSize: 32,
        ),
        const SizedBox(width: 24),
        FloatingActionButton.large(
          onPressed: () {
            if (isRunning) {
              notifier.pause();
            } else {
              notifier.start();
            }
          },
          child: Icon(isRunning ? LucideIcons.pause : LucideIcons.play),
        ),
        const SizedBox(width: 24),
        // Just a placeholder for maybe "Skip" or "Settings"
        IconButton.filledTonal(
          onPressed: () {
            // TODO: Open settings
          },
          icon: const Icon(LucideIcons.settings),
           iconSize: 32,
        ),
      ],
    );
  }
}
