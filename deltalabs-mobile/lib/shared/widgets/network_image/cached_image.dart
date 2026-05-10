import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../loading/shimmer_loader.dart';

/// Cached network image with shimmer placeholder and error fallback.
class CachedImage extends StatelessWidget {
  const CachedImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.errorWidget,
  });

  final String? url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Widget? errorWidget;

  @override
  Widget build(BuildContext context) {
    final image = _buildImage(context);

    if (borderRadius != null) {
      return ClipRRect(borderRadius: borderRadius!, child: image);
    }

    return image;
  }

  Widget _buildImage(BuildContext context) {
    if (url == null || url!.isEmpty) {
      return _buildError(context);
    }

    return CachedNetworkImage(
      imageUrl: url!,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) =>
          placeholder ??
          ShimmerLoader(
            child: ShimmerBox(
              width: width ?? double.infinity,
              height: height ?? double.infinity,
            ),
          ),
      errorWidget: (context, url, error) => _buildError(context),
    );
  }

  Widget _buildError(BuildContext context) {
    return errorWidget ??
        Container(
          width: width,
          height: height,
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          child: Icon(
            Icons.broken_image_outlined,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        );
  }
}
