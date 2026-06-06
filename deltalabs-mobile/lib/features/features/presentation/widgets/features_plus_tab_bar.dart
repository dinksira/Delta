import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_hub_categories.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/shimmer_loader.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Plus Messenger–style horizontal category tabs — only pinned categories + All.
class FeaturesPlusTabBar extends StatefulWidget {
  const FeaturesPlusTabBar({
    required this.selectedId,
    required this.counts,
    required this.pinnedTabs,
    required this.onSelected,
    required this.onReorderPinned,
    required this.onUnpin,
    this.showLoadingHint = false,
    super.key,
  });

  final String selectedId;
  final Map<String, int> counts;
  final List<FeatureHubCategory> pinnedTabs;
  final ValueChanged<String> onSelected;
  final void Function(int oldIndex, int newIndex) onReorderPinned;
  final ValueChanged<String> onUnpin;
  final bool showLoadingHint;

  @override
  State<FeaturesPlusTabBar> createState() => _FeaturesPlusTabBarState();
}

class _FeaturesPlusTabBarState extends State<FeaturesPlusTabBar> {
  bool _editing = false;

  @override
  void didUpdateWidget(FeaturesPlusTabBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pinnedTabs.isEmpty && _editing) {
      _editing = false;
    }
  }

  void _enterEditMode() {
    if (_editing || widget.pinnedTabs.isEmpty) return;
    HapticFeedback.mediumImpact();
    setState(() => _editing = true);
  }

  void _exitEditMode() {
    if (!_editing) return;
    setState(() => _editing = false);
  }

  void _selectTab(String id) {
    if (_editing) {
      _exitEditMode();
    }
    widget.onSelected(id);
  }

  Future<void> _confirmRemove(FeatureHubCategory tab) async {
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        title: Text('Remove ${tab.label}?'),
        content: Text(
          '${tab.label} will be removed from the tab bar. Your saved instances stay on the All tab.',
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
      widget.onUnpin(tab.id);
      if (widget.pinnedTabs.length <= 1) {
        _exitEditMode();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
      child: Container(
        height: 52,
        decoration: BoxDecoration(
          color: const Color(0xFFECECEC),
          borderRadius: BorderRadius.circular(26),
        ),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 6, top: 6, bottom: 6),
              child: _PlusTabChip(
                icon: FeatureHubCategories.all.icon,
                label: FeatureHubCategories.all.label,
                count: widget.counts[FeatureHubCategories.all.id] ?? 0,
                selected: widget.selectedId == FeatureHubCategories.all.id,
                editing: _editing,
                onTap: _editing
                    ? () {}
                    : () => _selectTab(FeatureHubCategories.all.id),
              ),
            ),
            if (widget.showLoadingHint && !_editing)
              Padding(
                padding: const EdgeInsets.only(left: 4, top: 6, bottom: 6),
                child: ShimmerLoader(
                  child: ShimmerBox(
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                  ),
                ),
              ),
            if (widget.pinnedTabs.isNotEmpty)
              Expanded(
                child: _editing ? _buildEditableTabs() : _buildNormalTabs(),
              )
            else if (_editing)
              const Spacer(),
            if (_editing) _EditDoneButton(onPressed: _exitEditMode),
          ],
        ),
      ),
    );
  }

  Widget _buildNormalTabs() {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(4, 6, 6, 6),
      itemCount: widget.pinnedTabs.length,
      separatorBuilder: (_, __) => const SizedBox(width: 4),
      itemBuilder: (context, index) {
        final tab = widget.pinnedTabs[index];
        return _PlusTabChip(
          icon: tab.icon,
          label: tab.label,
          count: widget.counts[tab.id] ?? 0,
          selected: tab.id == widget.selectedId,
          editing: false,
          onTap: () => _selectTab(tab.id),
          onLongPress: _enterEditMode,
        );
      },
    );
  }

  Widget _buildEditableTabs() {
    return ReorderableListView.builder(
      scrollDirection: Axis.horizontal,
      buildDefaultDragHandles: false,
      padding: const EdgeInsets.fromLTRB(4, 6, 6, 6),
      itemCount: widget.pinnedTabs.length,
      onReorder: (oldIndex, newIndex) {
        if (newIndex > oldIndex) newIndex -= 1;
        widget.onReorderPinned(oldIndex, newIndex);
      },
      proxyDecorator: (child, index, animation) {
        return AnimatedBuilder(
          animation: animation,
          builder: (context, _) {
            return Material(
              color: Colors.transparent,
              elevation: 8 * animation.value,
              shadowColor: Colors.black26,
              borderRadius: BorderRadius.circular(20),
              child: child,
            );
          },
        );
      },
      itemBuilder: (context, index) {
        final tab = widget.pinnedTabs[index];
        return Padding(
          key: ValueKey('plus_tab_${tab.id}'),
          padding: const EdgeInsets.only(right: 4),
          child: SizedBox(
            width: 44,
            height: 40,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                ReorderableDragStartListener(
                  index: index,
                  child: _PlusTabChip(
                    icon: tab.icon,
                    label: tab.label,
                    count: widget.counts[tab.id] ?? 0,
                    selected: tab.id == widget.selectedId,
                    editing: true,
                    onTap: () {},
                  ),
                ),
                Positioned(
                  right: -2,
                  top: -4,
                  child: _RemoveTabBadge(onTap: () => _confirmRemove(tab)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _EditDoneButton extends StatelessWidget {
  const _EditDoneButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6, top: 6, bottom: 6),
      child: Material(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.check_rounded, size: 18, color: Colors.white),
                SizedBox(width: 4),
                Text(
                  'Done',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlusTabChip extends StatelessWidget {
  const _PlusTabChip({
    required this.icon,
    required this.label,
    required this.count,
    required this.selected,
    required this.editing,
    required this.onTap,
    this.onLongPress,
  });

  final IconData icon;
  final String label;
  final int count;
  final bool selected;
  final bool editing;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: editing
          ? 'Drag to reorder'
          : (onLongPress != null ? '$label · hold to edit' : label),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          onLongPress: editing ? null : onLongPress,
          borderRadius: BorderRadius.circular(20),
          child: SizedBox(
            width: 44,
            height: 40,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                AnimatedScale(
                  scale: editing ? 0.92 : 1,
                  duration: const Duration(milliseconds: 160),
                  curve: Curves.easeOut,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: selected && !editing
                          ? AppColors.primary
                          : Colors.transparent,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      icon,
                      size: 22,
                      color: selected && !editing
                          ? Colors.white
                          : const Color(0xFF707579),
                    ),
                  ),
                ),
                if (!editing && count > 0)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: selected ? Colors.white : const Color(0xFF9AA0A6),
                        borderRadius: BorderRadius.circular(9),
                        border: Border.all(
                          color: selected ? AppColors.primary : const Color(0xFFECECEC),
                          width: 1.5,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        count > 99 ? '99+' : '$count',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: selected ? AppColors.primary : Colors.white,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RemoveTabBadge extends StatelessWidget {
  const _RemoveTabBadge({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: AppColors.error,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 3,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: const Icon(
            Icons.close_rounded,
            size: 12,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
