import 'package:deltalabs_mobile/features/search/domain/entities/search_user_hit.dart';
import 'package:flutter/material.dart';

class SearchUserRow extends StatelessWidget {
  const SearchUserRow({required this.user, super.key});

  final SearchUserHit user;

  @override
  Widget build(BuildContext context) {
    final initial = user.username.isNotEmpty ? user.username[0].toUpperCase() : '?';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: const Color(0xFF2C2C2E),
            child: Text(
              initial,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              '@${user.username}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
