import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/feature_instance_navigation.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Full-screen feature search (feed-style: icon in header → dedicated search page).
class FeaturesSearchPage extends HookConsumerWidget {
  const FeaturesSearchPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTextEditingController();
    final focusNode = useFocusNode();
    final query = useState('');

    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) => focusNode.requestFocus());
      return null;
    }, const []);

    final hub = ref.watch(featuresHubProvider);
    final q = query.value.trim().toLowerCase();
    final results = hub.visibleCards.where((card) {
      if (q.isEmpty) return true;
      return '${card.displayTitle} ${card.description} ${card.id}'
          .toLowerCase()
          .contains(q);
    }).toList();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 4, 12, 8),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                      color: AppColors.primary,
                    ),
                    Expanded(
                      child: TextField(
                        controller: controller,
                        focusNode: focusNode,
                        onChanged: (v) => query.value = v,
                        textInputAction: TextInputAction.search,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Search features',
                          hintStyle: const TextStyle(color: AppColors.textHint),
                          filled: true,
                          fillColor: Colors.white,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 11,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppColors.inputBorder),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppColors.inputBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(
                              color: AppColors.inputBorderFocused,
                              width: 1.5,
                            ),
                          ),
                          suffixIcon: ValueListenableBuilder<TextEditingValue>(
                            valueListenable: controller,
                            builder: (_, value, __) {
                              if (value.text.isEmpty) {
                                return const SizedBox.shrink();
                              }
                              return IconButton(
                                onPressed: () {
                                  controller.clear();
                                  query.value = '';
                                },
                                icon: const Icon(
                                  Icons.close_rounded,
                                  size: 20,
                                  color: AppColors.textHint,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
            child: _ResultsBody(
              hub: hub,
              results: results,
              query: q,
              onOpenCard: (card) async {
                await addFeatureFromCatalog(context, ref, card);
                if (context.mounted) context.pop();
              },
            ),
          ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultsBody extends StatelessWidget {
  const _ResultsBody({
    required this.hub,
    required this.results,
    required this.query,
    required this.onOpenCard,
  });

  final FeaturesHubState hub;
  final List<FeatureCardUi> results;
  final String query;
  final void Function(FeatureCardUi card) onOpenCard;

  @override
  Widget build(BuildContext context) {
    if (hub.isLoading && hub.catalog.isEmpty) {
      return const Center(child: DlLoadingIndicator(size: DlLoadingSize.medium));
    }

    if (query.isNotEmpty && results.isEmpty) {
      return const Center(
        child: Text(
          'No matching features',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
        ),
      );
    }

    if (results.isEmpty) {
      return const Center(
        child: Text(
          'Search your feature cards',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: results.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final card = results[index];
        return Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          clipBehavior: Clip.antiAlias,
          child: ListTile(
            onTap: card.disabled ? null : () => onOpenCard(card),
            leading: CircleAvatar(
              backgroundColor: card.visuals.chipBackground,
              child: Icon(card.visuals.icon, color: card.visuals.chipForeground),
            ),
            title: Text(
              card.displayTitle,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            subtitle: Text(
              card.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Icon(
              Icons.chevron_right_rounded,
              color: card.disabled ? AppColors.textHint : AppColors.primaryLight,
            ),
          ),
        );
      },
    );
  }
}
