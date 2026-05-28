import 'package:deltalabs_mobile/core/error/failures.dart';

import 'package:deltalabs_mobile/core/theme/app_colors.dart';

import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';

import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';

import 'package:deltalabs_mobile/features/features/presentation/widgets/feature_card_menu_popup.dart';

import 'package:deltalabs_mobile/features/features/presentation/widgets/feature_card_tile.dart';

import 'package:deltalabs_mobile/features/features/presentation/widgets/features_hub_error_view.dart';

import 'package:deltalabs_mobile/features/workspace/feature_workspace_navigation.dart';

import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';

import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:reorderables/reorderables.dart';



/// Features hub — real catalog + per-user layout (order, hidden, labels).

class FeaturesHubPage extends ConsumerStatefulWidget {

  const FeaturesHubPage({super.key});



  @override

  ConsumerState<FeaturesHubPage> createState() => _FeaturesHubPageState();

}



class _FeaturesHubPageState extends ConsumerState<FeaturesHubPage> {

  static String _formatError(Object? error) {

    if (error is Failure) return error.message;

    return error?.toString() ?? 'Unknown error';

  }



  Future<void> _confirmRemove(FeatureCardUi card) async {

    final ok = await showDialog<bool>(

      context: context,

      builder: (ctx) => AlertDialog(

        title: const Text('Remove card?'),

        content: Text(

          '${card.displayTitle} will be hidden from your dashboard. '

          'You can add it back with the + button.',

        ),

        actions: [

          TextButton(

            onPressed: () => Navigator.pop(ctx, false),

            child: const Text('Cancel'),

          ),

          FilledButton(

            style: FilledButton.styleFrom(backgroundColor: AppColors.error),

            onPressed: () => Navigator.pop(ctx, true),

            child: const Text('Remove'),

          ),

        ],

      ),

    );

    if (ok == true && mounted) {

      await ref.read(featuresHubProvider.notifier).setHidden(card.id, true);

    }

  }



  Future<void> _rename(FeatureCardUi card) async {

    final controller = TextEditingController(text: card.displayTitle);

    final saved = await showDialog<bool>(

      context: context,

      builder: (ctx) => AlertDialog(

        title: const Text('Rename card'),

        content: TextField(

          controller: controller,

          autofocus: true,

          maxLength: 32,

          decoration: const InputDecoration(

            hintText: 'Card name',

            border: OutlineInputBorder(),

          ),

        ),

        actions: [

          TextButton(

            onPressed: () => Navigator.pop(ctx, false),

            child: const Text('Cancel'),

          ),

          FilledButton(

            onPressed: () => Navigator.pop(ctx, true),

            child: const Text('Save'),

          ),

        ],

      ),

    );

    if (saved == true && mounted) {

      await ref.read(featuresHubProvider.notifier).rename(card.id, controller.text);

    }

    controller.dispose();

  }



  void _openAddCardSheet() {

    final state = ref.read(featuresHubProvider);

    final hidden = state.hiddenCards;

    if (hidden.isEmpty) {

      ScaffoldMessenger.of(context).showSnackBar(

        const SnackBar(

          content: Text(

            'No hidden cards. Remove a card from the grid to restore it here.',

          ),

          behavior: SnackBarBehavior.floating,

        ),

      );

      return;

    }



    showModalBottomSheet<void>(

      context: context,

      isScrollControlled: true,

      backgroundColor: Colors.white,

      shape: const RoundedRectangleBorder(

        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),

      ),

      builder: (ctx) {

        return DraggableScrollableSheet(

          expand: false,

          initialChildSize: 0.55,

          minChildSize: 0.35,

          maxChildSize: 0.85,

          builder: (context, scrollController) {

            return Column(

              crossAxisAlignment: CrossAxisAlignment.stretch,

              children: [

                const Padding(

                  padding: EdgeInsets.fromLTRB(20, 16, 20, 8),

                  child: Text(

                    'Add card',

                    style: TextStyle(

                      fontSize: 18,

                      fontWeight: FontWeight.w700,

                      color: AppColors.primary,

                    ),

                  ),

                ),

                const Padding(

                  padding: EdgeInsets.symmetric(horizontal: 20),

                  child: Text(

                    'Restore hidden features to your dashboard.',

                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),

                  ),

                ),

                const SizedBox(height: 8),

                Expanded(

                  child: ListView.separated(

                    controller: scrollController,

                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),

                    itemCount: hidden.length,

                    separatorBuilder: (_, __) => const SizedBox(height: 8),

                    itemBuilder: (context, index) {

                      final card = hidden[index];

                      return ListTile(

                        shape: RoundedRectangleBorder(

                          borderRadius: BorderRadius.circular(12),

                          side: BorderSide(

                            color: AppColors.inputBorder.withValues(alpha: 0.6),

                          ),

                        ),

                        leading: CircleAvatar(

                          backgroundColor: card.visuals.chipBackground,

                          child: Icon(

                            card.visuals.icon,

                            color: card.visuals.chipForeground,

                          ),

                        ),

                        title: Text(

                          card.displayTitle,

                          style: const TextStyle(fontWeight: FontWeight.w600),

                        ),

                        subtitle: Text(

                          card.description,

                          maxLines: 1,

                          overflow: TextOverflow.ellipsis,

                        ),

                        trailing: FilledButton(

                          onPressed: () async {

                            Navigator.pop(ctx);

                            await ref

                                .read(featuresHubProvider.notifier)

                                .setHidden(card.id, false);

                          },

                          style: FilledButton.styleFrom(

                            backgroundColor: AppColors.primary,

                            padding: const EdgeInsets.symmetric(horizontal: 14),

                          ),

                          child: const Text('Add'),

                        ),

                      );

                    },

                  ),

                ),

              ],

            );

          },

        );

      },

    );

  }



  void _onCardTap(FeatureCardUi card) {
    openFeatureWorkspace(context, ref, card);
  }



  void _showCardMenu(FeatureCardUi card, int index, int cardCount, BuildContext anchor) {

    FeatureCardMenuPopup.show(

      context: context,

      anchorContext: anchor,

      canMoveLeft: index > 0,

      canMoveRight: index < cardCount - 1,

      onRename: () => _rename(card),

      onMoveLeft: () => ref.read(featuresHubProvider.notifier).moveByOffset(card.id, -1),

      onMoveRight: () => ref.read(featuresHubProvider.notifier).moveByOffset(card.id, 1),

      onRemove: () => _confirmRemove(card),

    );

  }



  @override

  Widget build(BuildContext context) {

    final state = ref.watch(featuresHubProvider);

    final cards = state.visibleCards;

    final showLoadError = state.loadError != null && state.catalog.isEmpty;



    ref.listen(featuresHubProvider, (prev, next) {

      if (next.saveError != null && next.saveError != prev?.saveError) {

        ScaffoldMessenger.of(context).showSnackBar(

          SnackBar(

            content: Text('Could not save changes: ${_formatError(next.saveError)}'),

            behavior: SnackBarBehavior.floating,

          ),

        );

      }

    });



    return Scaffold(

      backgroundColor: AppColors.surfaceGrey,

      floatingActionButton: showLoadError

          ? null

          : Opacity(
              opacity: state.hiddenCards.isEmpty ? 0.4 : 1,
              child: FloatingActionButton(
                onPressed:
                    state.hiddenCards.isEmpty ? null : _openAddCardSheet,
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: state.hiddenCards.isEmpty ? 0 : 4,
                tooltip: state.hiddenCards.isEmpty
                    ? 'No hidden cards to add'
                    : 'Add card',
                child: const Icon(Icons.add_rounded, size: 28),
              ),
            ),

      body: Column(

        crossAxisAlignment: CrossAxisAlignment.stretch,

        children: [

          if (state.isSaving && !showLoadError)

            const LinearProgressIndicator(minHeight: 2, color: AppColors.primary),

          Expanded(

            child: _buildBody(state, cards),

          ),

        ],

      ),

    );

  }



  Widget _buildBody(FeaturesHubState state, List<FeatureCardUi> cards) {

    if (state.isLoading && state.catalog.isEmpty) {

      return const Center(child: DlLoadingIndicator(size: DlLoadingSize.medium));

    }



    if (state.loadError != null && state.catalog.isEmpty) {

      return FeaturesHubErrorView(

        error: state.loadError,

        isRetrying: state.isLoading,

        onRetry: () => ref.read(featuresHubProvider.notifier).load(),

      );

    }



    if (cards.isEmpty) {

      return const Center(

        child: Text(

          'No features available for your account.',

          style: TextStyle(color: AppColors.textSecondary, fontSize: 15),

        ),

      );

    }



    return LayoutBuilder(

      builder: (context, constraints) {

        const spacing = 12.0;

        final cardWidth = (constraints.maxWidth - spacing * 3) / 2;



        return SingleChildScrollView(

          padding: const EdgeInsets.fromLTRB(12, 8, 12, 88),

          child: ReorderableWrap(

            spacing: spacing,

            runSpacing: spacing,

            needsLongPressDraggable: true,

            onReorder: (oldIndex, newIndex) {

              ref.read(featuresHubProvider.notifier).reorder(oldIndex, newIndex);

            },

            children: [

              for (var i = 0; i < cards.length; i++)

                SizedBox(

                  key: ValueKey(cards[i].id),

                  width: cardWidth,

                  child: FeatureCardTile(

                    card: cards[i],

                    onTap: () => _onCardTap(cards[i]),

                    onMenuTap: (anchor) => _showCardMenu(cards[i], i, cards.length, anchor),

                  ),

                ),

            ],

          ),

        );

      },

    );

  }

}


