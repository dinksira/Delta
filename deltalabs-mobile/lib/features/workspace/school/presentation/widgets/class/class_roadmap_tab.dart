import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_roadmap_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_roadmap_progress.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Mobile roadmap — free vertical path (left spine + full-width cards).
/// Avoids web-style left/right split that overflows on phone widths.
class ClassRoadmapTab extends HookConsumerWidget {
  const ClassRoadmapTab({
    required this.orgId,
    required this.schoolId,
    required this.classItemId,
    required this.canMutate,
    super.key,
  });

  final String orgId;
  final String schoolId;
  final String classItemId;
  final bool canMutate;

  static const _brand = Color(0xFF174A5F);
  static const _brandSoft = Color(0xFFEEF6F8);
  static const _emerald = Color(0xFF059669);
  static const _emeraldFill = Color(0xFF10B981);
  static const _slate = Color(0xFFE2E8F0);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = (
      orgId: orgId,
      schoolId: schoolId,
      classWorkspaceItemId: classItemId,
    );
    final roadmapAsync = ref.watch(schoolClassRoadmapProvider(query));
    final resourcesAsync = ref.watch(schoolClassRoadmapResourcesProvider(query));
    final saving = useState(false);
    final localDoc = useState<SchoolClassRoadmapModel?>(null);

    useEffect(() {
      roadmapAsync.whenData((doc) {
        localDoc.value = doc;
      });
      return null;
    }, [roadmapAsync]);

    Future<void> persist(SchoolClassRoadmapModel next) async {
      if (!canMutate) return;
      localDoc.value = next;
      saving.value = true;
      try {
        final saved = await ref.read(schoolRemoteDataSourceProvider).putClassRoadmap(
              orgId: orgId,
              schoolId: schoolId,
              classWorkspaceItemId: classItemId,
              roadmap: next,
            );
        localDoc.value = saved;
        ref.invalidate(schoolClassRoadmapProvider(query));
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not save roadmap'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        saving.value = false;
      }
    }

    Future<void> ensureResourceTables() async {
      if (!canMutate) return;
      final ds = ref.read(schoolRemoteDataSourceProvider);
      try {
        await Future.wait([
          ds.bootstrapClassAssignmentsTable(
            orgId: orgId,
            schoolId: schoolId,
            classWorkspaceItemId: classItemId,
          ),
          ds.bootstrapClassSchedulesTable(
            orgId: orgId,
            schoolId: schoolId,
            classWorkspaceItemId: classItemId,
          ),
        ]);
        ref.invalidate(schoolClassRoadmapResourcesProvider(query));
        ref.invalidate(
          schoolWorkspaceItemProvider((
            orgId: orgId,
            schoolId: schoolId,
            itemId: classItemId,
          )),
        );
      } catch (_) {}
    }

    useEffect(() {
      ensureResourceTables();
      return null;
    }, [canMutate]);

    return roadmapAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 48),
        child: Center(child: DlLoadingIndicator()),
      ),
      error: (_, __) => Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load roadmap',
          message: 'Pull to refresh and try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(schoolClassRoadmapProvider(query)),
        ),
      ),
      data: (serverDoc) {
        final doc = localDoc.value ?? serverDoc;
        final resources = resourcesAsync.maybeWhen(
          data: (r) => r,
          orElse: () => const SchoolClassRoadmapResourcesModel(),
        );
        final completedCount = countCompletedSections(doc);

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            16,
            8,
            16,
            160 +
                MediaQuery.paddingOf(context).bottom +
                MediaQuery.viewInsetsOf(context).bottom,
          ),
          children: [
            _Header(
              completedCount: completedCount,
              totalSections: doc.sections.length,
              saving: saving.value,
            ),
            const SizedBox(height: 16),
            if (doc.sections.isEmpty)
              SchoolStatePanel(
                icon: Icons.route_outlined,
                title: 'Start the class path',
                message: canMutate
                    ? 'Add the first section to build the learning path.'
                    : 'A school manager has not set up this roadmap yet.',
                actionLabel: canMutate ? 'Add first section' : null,
                onAction: canMutate
                    ? () {
                        final id = 'sec_${DateTime.now().millisecondsSinceEpoch}';
                        persist(
                          doc.copyWith(
                            sections: [
                              SchoolClassRoadmapSectionModel(id: id, title: 'New section'),
                            ],
                            currentSectionId: id,
                          ),
                        );
                      }
                    : null,
              )
            else
              _FreePath(
                doc: doc,
                canMutate: canMutate,
                onToggleCollapsed: (section) {
                  persist(
                    doc.copyWith(
                      sections: doc.sections
                          .map(
                            (s) => s.id == section.id
                                ? s.copyWith(collapsed: !s.collapsed)
                                : s,
                          )
                          .toList(),
                    ),
                  );
                },
                onSetCurrentSection: (section) {
                  persist(doc.copyWith(currentSectionId: section.id));
                },
                onUpdateSection: (section, title, description) {
                  persist(
                    doc.copyWith(
                      sections: doc.sections
                          .map(
                            (s) => s.id == section.id
                                ? s.copyWith(title: title, description: description)
                                : s,
                          )
                          .toList(),
                    ),
                  );
                },
                onToggleContent: (section, content) {
                  final nextStatus =
                      content.status == 'completed' ? 'pending' : 'completed';
                  persist(
                    doc.copyWith(
                      sections: doc.sections.map((s) {
                        if (s.id != section.id) return s;
                        return s.copyWith(
                          contents: s.contents
                              .map(
                                (c) => c.id == content.id
                                    ? c.copyWith(status: nextStatus)
                                    : c,
                              )
                              .toList(),
                        );
                      }).toList(),
                      currentSectionId: section.id,
                      currentContentId: content.id,
                    ),
                  );
                },
                onSetCurrentContent: (section, content) {
                  persist(
                    doc.copyWith(
                      currentSectionId: section.id,
                      currentContentId: content.id,
                    ),
                  );
                },
                onAddSection: () {
                  final id = 'sec_${DateTime.now().millisecondsSinceEpoch}';
                  persist(
                    doc.copyWith(
                      sections: [
                        ...doc.sections,
                        SchoolClassRoadmapSectionModel(id: id, title: 'New section'),
                      ],
                      currentSectionId: doc.currentSectionId ?? id,
                    ),
                  );
                },
              ),
            const SizedBox(height: 20),
            _ResourcesPanel(
              resources: resources,
              loading: resourcesAsync.isLoading,
              canMutate: canMutate,
              sections: doc.sections,
              onAttach: (resource, sectionId) {
                final contentId = 'cnt_${DateTime.now().millisecondsSinceEpoch}';
                persist(
                  doc.copyWith(
                    sections: doc.sections.map((s) {
                      if (s.id != sectionId) return s;
                      return s.copyWith(
                        contents: [
                          ...s.contents,
                          resource.toContent(contentId: contentId),
                        ],
                      );
                    }).toList(),
                    currentSectionId: sectionId,
                    currentContentId: contentId,
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.completedCount,
    required this.totalSections,
    required this.saving,
  });

  final int completedCount;
  final int totalSections;
  final bool saving;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ClassRoadmapTab._slate),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Class roadmap',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  totalSections == 0
                      ? 'No sections yet'
                      : '$completedCount of $totalSections sections passed',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          if (saving)
            const Padding(
              padding: EdgeInsets.only(right: 8),
              child: Text('Saving…', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: ClassRoadmapTab._brandSoft,
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.location_on, size: 12, color: ClassRoadmapTab._brand),
                SizedBox(width: 4),
                Text(
                  'Path',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: ClassRoadmapTab._brand,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FreePath extends StatelessWidget {
  const _FreePath({
    required this.doc,
    required this.canMutate,
    required this.onToggleCollapsed,
    required this.onSetCurrentSection,
    required this.onUpdateSection,
    required this.onToggleContent,
    required this.onSetCurrentContent,
    required this.onAddSection,
  });

  final SchoolClassRoadmapModel doc;
  final bool canMutate;
  final void Function(SchoolClassRoadmapSectionModel) onToggleCollapsed;
  final void Function(SchoolClassRoadmapSectionModel) onSetCurrentSection;
  final void Function(SchoolClassRoadmapSectionModel, String, String) onUpdateSection;
  final void Function(SchoolClassRoadmapSectionModel, SchoolClassRoadmapContentModel)
      onToggleContent;
  final void Function(SchoolClassRoadmapSectionModel, SchoolClassRoadmapContentModel)
      onSetCurrentContent;
  final VoidCallback onAddSection;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ClassRoadmapTab._slate),
      ),
      child: Column(
        children: [
          for (var i = 0; i < doc.sections.length; i++) ...[
            if (i > 0) const SizedBox(height: 16),
            _PathStep(
              section: doc.sections[i],
              sectionIndex: i,
              doc: doc,
              showConnectorBelow: i < doc.sections.length - 1 || canMutate,
              connectorFilled: resolveSectionMilestone(
                    section: doc.sections[i],
                    sectionIndex: i,
                    doc: doc,
                  ) !=
                  ClassRoadmapMilestone.upcoming,
              canMutate: canMutate,
              onToggleCollapsed: () => onToggleCollapsed(doc.sections[i]),
              onSetCurrentSection: () => onSetCurrentSection(doc.sections[i]),
              onUpdateSection: (title, description) =>
                  onUpdateSection(doc.sections[i], title, description),
              onToggleContent: (c) => onToggleContent(doc.sections[i], c),
              onSetCurrentContent: (c) => onSetCurrentContent(doc.sections[i], c),
            ),
          ],
          if (canMutate) ...[
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(
                  width: 32,
                  child: Center(
                    child: Icon(Icons.add_circle_outline, size: 22, color: ClassRoadmapTab._brand),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onAddSection,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ClassRoadmapTab._brand,
                      side: const BorderSide(color: Color(0xFF236B82), width: 1.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Add section'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _PathStep extends StatelessWidget {
  const _PathStep({
    required this.section,
    required this.sectionIndex,
    required this.doc,
    required this.showConnectorBelow,
    required this.connectorFilled,
    required this.canMutate,
    required this.onToggleCollapsed,
    required this.onSetCurrentSection,
    required this.onUpdateSection,
    required this.onToggleContent,
    required this.onSetCurrentContent,
  });

  final SchoolClassRoadmapSectionModel section;
  final int sectionIndex;
  final SchoolClassRoadmapModel doc;
  final bool showConnectorBelow;
  final bool connectorFilled;
  final bool canMutate;
  final VoidCallback onToggleCollapsed;
  final VoidCallback onSetCurrentSection;
  final void Function(String title, String description) onUpdateSection;
  final void Function(SchoolClassRoadmapContentModel) onToggleContent;
  final void Function(SchoolClassRoadmapContentModel) onSetCurrentContent;

  @override
  Widget build(BuildContext context) {
    final milestone = resolveSectionMilestone(
      section: section,
      sectionIndex: sectionIndex,
      doc: doc,
    );

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 32,
            child: Stack(
              alignment: Alignment.topCenter,
              children: [
                if (showConnectorBelow)
                  Positioned(
                    top: 52,
                    bottom: 0,
                    child: Container(
                      width: 4,
                      decoration: BoxDecoration(
                        color: connectorFilled
                            ? ClassRoadmapTab._emeraldFill
                            : ClassRoadmapTab._slate,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                Column(
                  children: [
                    _MilestoneDot(milestone: milestone),
                    const SizedBox(height: 8),
                    _CollapseButton(
                      collapsed: section.collapsed,
                      onTap: onToggleCollapsed,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SectionCard(
                  section: section,
                  sectionIndex: sectionIndex,
                  milestone: milestone,
                  canMutate: canMutate,
                  onSetCurrent: onSetCurrentSection,
                  onUpdateSection: onUpdateSection,
                ),
                if (!section.collapsed) ...[
                  const SizedBox(height: 8),
                  if (section.contents.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(left: 4, bottom: 4),
                      child: Text(
                        canMutate
                            ? 'Attach resources below to grow this section.'
                            : 'No items in this section yet.',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                    )
                  else
                    ...section.contents.map((content) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _ContentCard(
                          content: content,
                          isCurrent: isContentCurrent(
                            content: content,
                            section: section,
                            doc: doc,
                          ),
                          canMutate: canMutate,
                          onToggle: () => onToggleContent(content),
                          onSetHere: () => onSetCurrentContent(content),
                        ),
                      );
                    }),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MilestoneDot extends StatelessWidget {
  const _MilestoneDot({required this.milestone});

  final ClassRoadmapMilestone milestone;

  @override
  Widget build(BuildContext context) {
    final (fill, border) = switch (milestone) {
      ClassRoadmapMilestone.completed => (ClassRoadmapTab._emerald, const Color(0xFFD1FAE5)),
      ClassRoadmapMilestone.current => (ClassRoadmapTab._brand, Colors.white),
      ClassRoadmapMilestone.upcoming => (const Color(0xFFCBD5E1), Colors.white),
    };
    return Container(
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: fill,
        shape: BoxShape.circle,
        border: Border.all(color: border, width: 2),
        boxShadow: milestone == ClassRoadmapMilestone.current
            ? [
                BoxShadow(
                  color: ClassRoadmapTab._brand.withValues(alpha: 0.35),
                  spreadRadius: 3,
                ),
              ]
            : null,
      ),
    );
  }
}

class _CollapseButton extends StatelessWidget {
  const _CollapseButton({required this.collapsed, required this.onTap});

  final bool collapsed;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ClassRoadmapTab._brand,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 28,
          height: 28,
          child: Icon(
            collapsed ? Icons.add : Icons.remove,
            size: 16,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class _SectionCard extends StatefulWidget {
  const _SectionCard({
    required this.section,
    required this.sectionIndex,
    required this.milestone,
    required this.canMutate,
    required this.onSetCurrent,
    required this.onUpdateSection,
  });

  final SchoolClassRoadmapSectionModel section;
  final int sectionIndex;
  final ClassRoadmapMilestone milestone;
  final bool canMutate;
  final VoidCallback onSetCurrent;
  final void Function(String title, String description) onUpdateSection;

  @override
  State<_SectionCard> createState() => _SectionCardState();
}

class _SectionCardState extends State<_SectionCard> {
  late final TextEditingController _title;
  late final TextEditingController _description;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.section.title);
    _description = TextEditingController(text: widget.section.description);
  }

  @override
  void didUpdateWidget(covariant _SectionCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.section.title != widget.section.title &&
        _title.text != widget.section.title) {
      _title.text = widget.section.title;
    }
    if (oldWidget.section.description != widget.section.description &&
        _description.text != widget.section.description) {
      _description.text = widget.section.description;
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  void _commit() {
    widget.onUpdateSection(_title.text.trim(), _description.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final isCurrent = widget.milestone == ClassRoadmapMilestone.current;
    final badge = switch (widget.milestone) {
      ClassRoadmapMilestone.completed => ('Completed', ClassRoadmapTab._emerald, Colors.white),
      ClassRoadmapMilestone.current => ('In progress', ClassRoadmapTab._brand, Colors.white),
      ClassRoadmapMilestone.upcoming =>
        ('Upcoming', const Color(0xFFF1F5F9), const Color(0xFF64748B)),
    };

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrent ? const Color(0xFF236B82) : ClassRoadmapTab._slate,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF02182B).withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            decoration: BoxDecoration(
              gradient: isCurrent
                  ? const LinearGradient(
                      colors: [ClassRoadmapTab._brandSoft, Color(0xFFECFDF5)],
                    )
                  : null,
              color: isCurrent ? null : const Color(0xFFF8FAFC),
              border: const Border(bottom: BorderSide(color: ClassRoadmapTab._slate)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: ClassRoadmapTab._brand,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${widget.sectionIndex + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: badge.$2,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badge.$1.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: badge.$3,
                        ),
                      ),
                    ),
                    if (isCurrent)
                      const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.location_on, size: 12, color: ClassRoadmapTab._brand),
                          SizedBox(width: 2),
                          Text(
                            'Class is here',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF133E50),
                            ),
                          ),
                        ],
                      ),
                    if (widget.canMutate && !isCurrent)
                      TextButton(
                        onPressed: widget.onSetCurrent,
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Set current',
                          style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                        ),
                      ),
                    if (widget.milestone == ClassRoadmapMilestone.completed)
                      Container(
                        width: 28,
                        height: 28,
                        decoration: const BoxDecoration(
                          color: ClassRoadmapTab._emerald,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check, size: 16, color: Colors.white),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                if (widget.canMutate)
                  TextField(
                    controller: _title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F3344),
                    ),
                    decoration: const InputDecoration(
                      isDense: true,
                      border: InputBorder.none,
                      hintText: 'Section title',
                      contentPadding: EdgeInsets.zero,
                    ),
                    onEditingComplete: _commit,
                    onSubmitted: (_) => _commit(),
                  )
                else
                  Text(
                    widget.section.title.isEmpty ? 'Section' : widget.section.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F3344),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (widget.canMutate)
                  TextField(
                    controller: _description,
                    maxLines: 2,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: Color(0xFF475569),
                    ),
                    decoration: InputDecoration(
                      isDense: true,
                      hintText: 'What should the class achieve in this section?',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: ClassRoadmapTab._slate),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: ClassRoadmapTab._slate),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                    onEditingComplete: _commit,
                  )
                else if (widget.section.description.isNotEmpty)
                  Text(
                    widget.section.description,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: Color(0xFF475569),
                    ),
                  ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: (widget.section.tags.isEmpty ? ['milestone'] : widget.section.tags)
                      .map(
                        (tag) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: ClassRoadmapTab._brandSoft,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '#$tag',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: ClassRoadmapTab._brand,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ContentCard extends StatelessWidget {
  const _ContentCard({
    required this.content,
    required this.isCurrent,
    required this.canMutate,
    required this.onToggle,
    required this.onSetHere,
  });

  final SchoolClassRoadmapContentModel content;
  final bool isCurrent;
  final bool canMutate;
  final VoidCallback onToggle;
  final VoidCallback onSetHere;

  @override
  Widget build(BuildContext context) {
    final done = content.status == 'completed';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(10, 8, 4, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isCurrent
              ? ClassRoadmapTab._brand
              : done
                  ? const Color(0xFFA7F3D0)
                  : ClassRoadmapTab._slate,
        ),
      ),
      child: Row(
        children: [
          Icon(
            done ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 18,
            color: done
                ? ClassRoadmapTab._emerald
                : isCurrent
                    ? ClassRoadmapTab._brand
                    : const Color(0xFF94A3B8),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  content.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [
                    content.contentType,
                    if (isCurrent) 'Now',
                  ].join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w400,
                    color: isCurrent ? ClassRoadmapTab._brand : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          if (canMutate) ...[
            IconButton(
              tooltip: done ? 'Undo' : 'Done',
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              onPressed: onToggle,
              icon: Icon(
                done ? Icons.undo : Icons.done,
                size: 16,
                color: const Color(0xFF64748B),
              ),
            ),
            if (!isCurrent)
              IconButton(
                tooltip: 'Here',
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                onPressed: onSetHere,
                icon: const Icon(Icons.flag_outlined, size: 16, color: Color(0xFF64748B)),
              ),
          ],
        ],
      ),
    );
  }
}

class _ResourcesPanel extends StatelessWidget {
  const _ResourcesPanel({
    required this.resources,
    required this.loading,
    required this.canMutate,
    required this.sections,
    required this.onAttach,
  });

  final SchoolClassRoadmapResourcesModel resources;
  final bool loading;
  final bool canMutate;
  final List<SchoolClassRoadmapSectionModel> sections;
  final void Function(SchoolClassRoadmapSidebarResourceModel, String) onAttach;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ClassRoadmapTab._slate),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Resources',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Tap a resource to attach it to a section.',
            style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 12),
          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: DlLoadingIndicator()),
            )
          else if (resources.all.isEmpty)
            const Text(
              'No resources yet. Create sessions or assignments first.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            )
          else ...[
            if (resources.sessions.isNotEmpty)
              _ResourceGroup(
                title: 'Sessions',
                items: resources.sessions,
                canMutate: canMutate,
                sections: sections,
                onAttach: onAttach,
              ),
            if (resources.materials.isNotEmpty)
              _ResourceGroup(
                title: 'Class materials',
                items: resources.materials,
                canMutate: canMutate,
                sections: sections,
                onAttach: onAttach,
              ),
            if (resources.courses.isNotEmpty)
              _ResourceGroup(
                title: 'Courses',
                items: resources.courses,
                canMutate: canMutate,
                sections: sections,
                onAttach: onAttach,
              ),
          ],
        ],
      ),
    );
  }
}

class _ResourceGroup extends StatelessWidget {
  const _ResourceGroup({
    required this.title,
    required this.items,
    required this.canMutate,
    required this.sections,
    required this.onAttach,
  });

  final String title;
  final List<SchoolClassRoadmapSidebarResourceModel> items;
  final bool canMutate;
  final List<SchoolClassRoadmapSectionModel> sections;
  final void Function(SchoolClassRoadmapSidebarResourceModel, String) onAttach;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(height: 6),
          ...items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Material(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: !canMutate || sections.isEmpty
                      ? null
                      : () async {
                          final sectionId = await showModalBottomSheet<String>(
                            context: context,
                            builder: (ctx) => SafeArea(
                              child: ListView(
                                shrinkWrap: true,
                                children: [
                                  const ListTile(
                                    title: Text(
                                      'Add to section',
                                      style: TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                  ...sections.map(
                                    (s) => ListTile(
                                      title: Text(s.title),
                                      onTap: () => Navigator.pop(ctx, s.id),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                          if (sectionId != null) onAttach(item, sectionId);
                        },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                    child: Row(
                      children: [
                        Icon(_iconFor(item.kind), size: 18, color: ClassRoadmapTab._brand),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              if (item.subtitle != null && item.subtitle!.isNotEmpty)
                                Text(
                                  item.subtitle!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                            ],
                          ),
                        ),
                        if (canMutate && sections.isNotEmpty)
                          const Icon(Icons.add_circle_outline, size: 18, color: Color(0xFF94A3B8)),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  IconData _iconFor(String kind) {
    switch (kind) {
      case 'course':
        return Icons.menu_book_outlined;
      case 'assignment':
        return Icons.assignment_outlined;
      case 'exam':
        return Icons.quiz_outlined;
      case 'video':
        return Icons.videocam_outlined;
      default:
        return Icons.play_lesson_outlined;
    }
  }
}
