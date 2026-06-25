import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_attendance_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_attendance_utils.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

enum _AttendanceSubview { marks, devices }

class ClassAttendanceTab extends HookConsumerWidget {
  const ClassAttendanceTab({
    required this.orgId,
    required this.schoolId,
    required this.classItemId,
    required this.classItem,
    required this.canMutate,
    required this.onGoToSessions,
    super.key,
  });

  final String orgId;
  final String schoolId;
  final String classItemId;
  final SchoolWorkspaceItemModel classItem;
  final bool canMutate;
  final VoidCallback onGoToSessions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subview = useState(_AttendanceSubview.marks);
    final patching = useState(false);

    final attendanceQuery = (
      orgId: orgId,
      schoolId: schoolId,
      classWorkspaceItemId: classItemId,
    );
    final attendanceAsync = ref.watch(schoolClassAttendanceProvider(attendanceQuery));

    final studentsInstanceId = classItem.studentsTableInstanceId;
    final rowsAsync = studentsInstanceId == null
        ? null
        : ref.watch(
            managementTableRowsProvider((
              orgId: orgId,
              schoolId: schoolId,
              instanceId: studentsInstanceId,
              groupId: 'mtg_main',
            )),
          );

    Future<void> toggleMark({
      required String studentId,
      required String sessionId,
      required String? current,
    }) async {
      if (!canMutate || patching.value) return;
      patching.value = true;
      try {
        final next = nextAttendanceMark(current);
        await ref.read(schoolRemoteDataSourceProvider).patchClassAttendanceMark(
              orgId: orgId,
              schoolId: schoolId,
              classWorkspaceItemId: classItemId,
              studentId: studentId,
              sessionId: sessionId,
              status: next,
            );
        ref.invalidate(schoolClassAttendanceProvider(attendanceQuery));
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not update attendance'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        patching.value = false;
      }
    }

    return attendanceAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 48),
        child: Center(child: DlLoadingIndicator()),
      ),
      error: (_, __) => Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load attendance',
          message: 'Pull to refresh and try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(schoolClassAttendanceProvider(attendanceQuery)),
        ),
      ),
      data: (attendance) {
        final students = rowsAsync?.maybeWhen(
              data: (rows) => attendanceStudentsFromRows(classItem: classItem, rows: rows.items),
              orElse: () => <AttendanceStudentRowModel>[],
            ) ??
            const <AttendanceStudentRowModel>[];

        final studentsLoading =
            studentsInstanceId != null && (rowsAsync?.isLoading ?? false);

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            const Text(
              'Attendance',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Session columns come from the Class tab. Mark each student per session.',
              style: TextStyle(fontSize: 13, height: 1.4, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            SegmentedButton<_AttendanceSubview>(
              segments: const [
                ButtonSegment(
                  value: _AttendanceSubview.marks,
                  label: Text('Marks'),
                  icon: Icon(Icons.grid_on_outlined, size: 18),
                ),
                ButtonSegment(
                  value: _AttendanceSubview.devices,
                  label: Text('Devices'),
                  icon: Icon(Icons.fingerprint_outlined, size: 18),
                ),
              ],
              selected: {subview.value},
              onSelectionChanged: (value) => subview.value = value.first,
            ),
            const SizedBox(height: 16),
            if (subview.value == _AttendanceSubview.marks)
              _AttendanceMarksPanel(
                sessions: attendance.sessions,
                students: students,
                studentsLoading: studentsLoading,
                hasStudentsTable: studentsInstanceId != null,
                marks: attendance.marks,
                canMutate: canMutate,
                patching: patching.value,
                onGoToSessions: onGoToSessions,
                onToggleMark: toggleMark,
                onSessionSettings: canMutate
                    ? (session) => _showSessionSettingsSheet(
                          context: context,
                          ref: ref,
                          session: session,
                          attendanceQuery: attendanceQuery,
                        )
                    : null,
              )
            else
              _AttendanceDevicesPanel(
                devices: attendance.devices,
                sessions: attendance.sessions,
                canMutate: canMutate,
                onRegister: () => _showRegisterDeviceSheet(
                  context: context,
                  ref: ref,
                  sessions: attendance.sessions,
                  attendanceQuery: attendanceQuery,
                ),
              ),
            if (patching.value)
              const Padding(
                padding: EdgeInsets.only(top: 12),
                child: Center(
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _AttendanceMarksPanel extends StatelessWidget {
  const _AttendanceMarksPanel({
    required this.sessions,
    required this.students,
    required this.studentsLoading,
    required this.hasStudentsTable,
    required this.marks,
    required this.canMutate,
    required this.patching,
    required this.onGoToSessions,
    required this.onToggleMark,
    this.onSessionSettings,
  });

  final List<SchoolAttendanceSessionModel> sessions;
  final List<AttendanceStudentRowModel> students;
  final bool studentsLoading;
  final bool hasStudentsTable;
  final Map<String, String> marks;
  final bool canMutate;
  final bool patching;
  final VoidCallback onGoToSessions;
  final Future<void> Function({
    required String studentId,
    required String sessionId,
    required String? current,
  }) onToggleMark;
  final void Function(SchoolAttendanceSessionModel session)? onSessionSettings;

  @override
  Widget build(BuildContext context) {
    if (sessions.isEmpty) {
      return SchoolStatePanel(
        icon: Icons.play_lesson_outlined,
        title: 'No class sessions yet',
        message: 'Create sessions on the Class tab first — each session becomes an attendance column.',
        actionLabel: 'Go to sessions',
        onAction: onGoToSessions,
      );
    }

    if (!hasStudentsTable) {
      return const SchoolStatePanel(
        icon: Icons.people_outline,
        title: 'Students table required',
        message: 'Set up the Students tab first, then return here to mark attendance.',
      );
    }

    if (studentsLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: Center(child: DlLoadingIndicator()),
      );
    }

    if (students.isEmpty) {
      return const SchoolStatePanel(
        icon: Icons.people_outline,
        title: 'No students yet',
        message: 'Add students on the Students tab, then return here to mark attendance.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${students.length} student${students.length == 1 ? '' : 's'} · ${sessions.length} session${sessions.length == 1 ? '' : 's'}',
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 12),
        DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowHeight: 44,
                dataRowMinHeight: 48,
                dataRowMaxHeight: 56,
                columnSpacing: 8,
                horizontalMargin: 12,
                columns: [
                  const DataColumn(label: Text('Student', style: TextStyle(fontWeight: FontWeight.w700))),
                  ...sessions.map(
                    (session) => DataColumn(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (session.hidden)
                            const Padding(
                              padding: EdgeInsets.only(right: 4),
                              child: Icon(Icons.visibility_off_outlined, size: 14, color: AppColors.textHint),
                            ),
                          Text(
                            session.title,
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: session.hidden ? AppColors.textHint : AppColors.textPrimary,
                            ),
                          ),
                          if (onSessionSettings != null) ...[
                            const SizedBox(width: 2),
                            InkWell(
                              onTap: () => onSessionSettings!(session),
                              child: const Icon(Icons.tune_rounded, size: 16, color: AppColors.textHint),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
                rows: students.map((student) {
                  return DataRow(
                    cells: [
                      DataCell(
                        SizedBox(
                          width: 120,
                          child: Text(
                            student.label,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                      ...sessions.map((session) {
                        final key = SchoolClassAttendanceStateModel.markKey(student.id, session.id);
                        final status = marks[key];
                        return DataCell(
                          _AttendanceMarkCell(
                            status: status,
                            deviceMode: session.isDeviceTracking,
                            enabled: canMutate && !patching && !session.isDeviceTracking,
                            onTap: () => onToggleMark(
                              studentId: student.id,
                              sessionId: session.id,
                              current: status,
                            ),
                          ),
                        );
                      }),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AttendanceMarkCell extends StatelessWidget {
  const _AttendanceMarkCell({
    required this.status,
    required this.deviceMode,
    required this.enabled,
    required this.onTap,
  });

  final String? status;
  final bool deviceMode;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    if (deviceMode) {
      final filled = status == 'present';
      return Center(
        child: Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: filled ? const Color(0xFFB0BEC5) : const Color(0xFFECEFF1),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      );
    }

    IconData icon;
    Color color;
    Color? fill;
    switch (status) {
      case 'present':
        icon = Icons.check_rounded;
        color = const Color(0xFF2E7D32);
        fill = const Color(0xFFE8F5E9);
      case 'absent':
        icon = Icons.close_rounded;
        color = const Color(0xFFC62828);
        fill = const Color(0xFFFFEBEE);
      case 'late':
        icon = Icons.schedule_rounded;
        color = const Color(0xFFE65100);
        fill = const Color(0xFFFFF3E0);
      default:
        return InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(6),
          child: Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.inputBorder),
              borderRadius: BorderRadius.circular(6),
            ),
          ),
        );
    }

    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: fill,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withValues(alpha: 0.35)),
        ),
        child: Icon(icon, size: 18, color: color),
      ),
    );
  }
}

class _AttendanceDevicesPanel extends StatelessWidget {
  const _AttendanceDevicesPanel({
    required this.devices,
    required this.sessions,
    required this.canMutate,
    required this.onRegister,
  });

  final List<SchoolAttendanceDeviceModel> devices;
  final List<SchoolAttendanceSessionModel> sessions;
  final bool canMutate;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (canMutate)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: onRegister,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Register device'),
            ),
          ),
        if (devices.isEmpty)
          const SchoolStatePanel(
            icon: Icons.fingerprint_outlined,
            title: 'No devices registered',
            message: 'Connect fingerprint or QR hardware for automatic attendance tracking.',
          )
        else
          ...devices.map(
            (device) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Icon(
                  device.deviceType == 'qr_scanner'
                      ? Icons.qr_code_scanner_rounded
                      : Icons.fingerprint_rounded,
                  color: AppColors.primary,
                ),
                title: Text(device.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text(
                  '${device.attendanceSessionLabel} · ${device.status}',
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: device.status == 'online' ? const Color(0xFF43A047) : AppColors.textHint,
                  ),
                ),
              ),
            ),
          ),
        if (sessions.isNotEmpty && devices.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Device columns use session settings (device tracking) on the Marks tab.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary.withValues(alpha: 0.9)),
            ),
          ),
      ],
    );
  }
}

Future<void> _showSessionSettingsSheet({
  required BuildContext context,
  required WidgetRef ref,
  required SchoolAttendanceSessionModel session,
  required SchoolClassAttendanceQuery attendanceQuery,
}) async {
  var hidden = session.hidden;
  var trackingMode = session.trackingMode;
  var saving = false;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (context, setState) {
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.paddingOf(context).bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  session.title,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Attendance column settings',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: trackingMode,
                  decoration: const InputDecoration(labelText: 'Tracking'),
                  items: const [
                    DropdownMenuItem(value: 'manual', child: Text('Manual — tap to mark')),
                    DropdownMenuItem(value: 'device', child: Text('Device — auto track')),
                  ],
                  onChanged: saving ? null : (v) => setState(() => trackingMode = v ?? 'manual'),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Hidden from parents'),
                  value: hidden,
                  onChanged: saving ? null : (v) => setState(() => hidden = v),
                ),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: saving
                      ? null
                      : () async {
                          setState(() => saving = true);
                          try {
                            await ref.read(schoolRemoteDataSourceProvider).updateClassAttendanceSessionSettings(
                                  orgId: attendanceQuery.orgId,
                                  schoolId: attendanceQuery.schoolId,
                                  classWorkspaceItemId: attendanceQuery.classWorkspaceItemId,
                                  classSessionId: session.id,
                                  hidden: hidden,
                                  trackingMode: trackingMode,
                                );
                            ref.invalidate(schoolClassAttendanceProvider(attendanceQuery));
                            if (context.mounted) Navigator.of(context).pop();
                          } catch (_) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Could not save session settings')),
                              );
                            }
                          } finally {
                            if (context.mounted) setState(() => saving = false);
                          }
                        },
                  child: Text(saving ? 'Saving…' : 'Save'),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}

Future<void> _showRegisterDeviceSheet({
  required BuildContext context,
  required WidgetRef ref,
  required List<SchoolAttendanceSessionModel> sessions,
  required SchoolClassAttendanceQuery attendanceQuery,
}) async {
  final nameController = TextEditingController();
  var deviceType = 'fingerprint';
  var sessionLabel = sessions.isNotEmpty ? sessions.first.title : 'Class Attendance';
  var saving = false;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (context, setState) {
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.paddingOf(context).bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Register device',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Device name'),
                  enabled: !saving,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: deviceType,
                  decoration: const InputDecoration(labelText: 'Device type'),
                  items: const [
                    DropdownMenuItem(value: 'fingerprint', child: Text('Fingerprint')),
                    DropdownMenuItem(value: 'qr_scanner', child: Text('QR scanner')),
                    DropdownMenuItem(value: 'other', child: Text('Other')),
                  ],
                  onChanged: saving ? null : (v) => setState(() => deviceType = v ?? 'fingerprint'),
                ),
                const SizedBox(height: 12),
                if (sessions.isNotEmpty)
                  DropdownButtonFormField<String>(
                    value: sessionLabel,
                    decoration: const InputDecoration(labelText: 'Class session'),
                    items: sessions
                        .map((s) => DropdownMenuItem(value: s.title, child: Text(s.title)))
                        .toList(),
                    onChanged: saving ? null : (v) => setState(() => sessionLabel = v ?? sessionLabel),
                  ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: saving
                      ? null
                      : () async {
                          final name = nameController.text.trim();
                          if (name.isEmpty) return;
                          setState(() => saving = true);
                          try {
                            await ref.read(schoolRemoteDataSourceProvider).registerClassAttendanceDevice(
                                  orgId: attendanceQuery.orgId,
                                  schoolId: attendanceQuery.schoolId,
                                  classWorkspaceItemId: attendanceQuery.classWorkspaceItemId,
                                  name: name,
                                  deviceType: deviceType,
                                  attendanceSessionLabel: sessionLabel,
                                );
                            ref.invalidate(schoolClassAttendanceProvider(attendanceQuery));
                            if (context.mounted) Navigator.of(context).pop();
                          } catch (_) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Could not register device')),
                              );
                            }
                          } finally {
                            if (context.mounted) setState(() => saving = false);
                          }
                        },
                  child: Text(saving ? 'Registering…' : 'Register'),
                ),
              ],
            ),
          );
        },
      );
    },
  );

  nameController.dispose();
}
