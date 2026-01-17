import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Colors from globals.css
  static const Color lightBackground = Color(0xFFF0F4F8);
  static const Color darkBackground = Color(0xFF0F172A);
  
  static const Color primary = Color(0xFF8B5CF6);
  static const Color primaryDark = Color(0xFFA78BFA); // Lighter for dark mode
  
  static const Color secondary = Color(0xFFEC4899);
  
  static const Color lightCard = Color(0xA6FFFFFF); // rgba(255, 255, 255, 0.65)
  static const Color darkCard = Color(0x991E293B); // rgba(30, 41, 59, 0.6)

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: secondary,
        surface: lightCard,
        background: lightBackground,
        onBackground: Color(0xFF2D3748),
      ),
      textTheme: GoogleFonts.interTextTheme(),
      cardTheme: CardTheme(
        color: lightCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0x99FFFFFF)),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: primaryDark,
        secondary: secondary,
        surface: darkCard,
        background: darkBackground,
        onBackground: Color(0xFFF1F5F9),
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      cardTheme: CardTheme(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0x1AFFFFFF)),
        ),
      ),
    );
  }
}
