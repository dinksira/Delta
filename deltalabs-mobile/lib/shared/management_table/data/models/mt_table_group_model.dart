class MtTableGroupModel {
  MtTableGroupModel({
    required this.id,
    required this.title,
    required this.order,
  });

  factory MtTableGroupModel.fromJson(Map<String, dynamic> json) {
    return MtTableGroupModel(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      order: json['order'] is num ? (json['order'] as num).toInt() : 0,
    );
  }

  static const mainGroupId = 'mtg_main';
  static const mainGroupTitle = 'Main Table';

  static MtTableGroupModel fallbackMain() => MtTableGroupModel(
        id: mainGroupId,
        title: mainGroupTitle,
        order: 0,
      );

  final String id;
  final String title;
  final int order;
}
