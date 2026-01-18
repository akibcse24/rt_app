import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum TimerStatus { initial, running, paused, completed }

class TimerState {
  final int duration; // in seconds
  final int remaining;
  final TimerStatus status;

  TimerState({
    required this.duration,
    required this.remaining,
    required this.status,
  });

  TimerState copyWith({
    int? duration,
    int? remaining,
    TimerStatus? status,
  }) {
    return TimerState(
      duration: duration ?? this.duration,
      remaining: remaining ?? this.remaining,
      status: status ?? this.status,
    );
  }

  double get progress => remaining / duration;
}

class TimerNotifier extends StateNotifier<TimerState> {
  TimerNotifier()
      : super(TimerState(
          duration: 1500, // 25 minutes
          remaining: 1500,
          status: TimerStatus.initial,
        ));

  Timer? _ticker;

  void start() {
    if (state.status == TimerStatus.running) return;
    
    state = state.copyWith(status: TimerStatus.running);
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.remaining > 0) {
        state = state.copyWith(remaining: state.remaining - 1);
      } else {
        _ticker?.cancel();
        state = state.copyWith(status: TimerStatus.completed);
      }
    });
  }

  void pause() {
    _ticker?.cancel();
    state = state.copyWith(status: TimerStatus.paused);
  }

  void reset() {
    _ticker?.cancel();
    state = TimerState(
      duration: 1500,
      remaining: 1500,
      status: TimerStatus.initial,
    );
  }
  
  void setDuration(int minutes) {
    _ticker?.cancel();
    final seconds = minutes * 60;
    state = TimerState(
      duration: seconds,
      remaining: seconds,
      status: TimerStatus.initial,
    );
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }
}

final timerProvider = StateNotifierProvider<TimerNotifier, TimerState>((ref) {
  return TimerNotifier();
});
