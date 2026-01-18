import 'package:flutter/material.dart';
import 'widgets/timer_display.dart';
import 'widgets/session_controls.dart';

class FocusScreen extends StatelessWidget {
  const FocusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.surface,
              Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              Theme.of(context).colorScheme.secondary.withValues(alpha: 0.05),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 48),
              Text(
                'Focus Session',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const Expanded(
                child: Center(
                  child: TimerDisplay(),
                ),
              ),
              const SessionControls(),
              const SizedBox(height: 64),
            ],
          ),
        ),
      ),
    );
  }
}
