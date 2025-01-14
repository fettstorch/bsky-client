import ReactPlayer from 'react-player/lazy';
import { BSkyPostEmbed } from '../lib/bluesky/types/BSkyPostEmbed';
import { Image } from './ui/Image';
import { NotImplementedBox } from './ui/NotImplementedBox';
import { cn } from '../lib/utils';
import { Link } from './ui/Link';
import { Debug } from './ui/Debug';
import { useSettings } from '../hooks/useSetting';
import TimeAgo from 'react-timeago-i18n';
import { useTranslation } from 'react-i18next';
import { Handle } from './ui/Handle';
import { isBlockedAuthor } from '../lib/bluesky/types/BlockedAuthor';
import { FacetedText } from './FacetedText';

export const PostEmbed = ({ embed }: { embed?: BSkyPostEmbed | null }) => {
  const { experiments } = useSettings();
  const { t } = useTranslation('post');
  if (!embed) return null;

  switch (embed.$type) {
    case 'app.bsky.embed.images#view': {
      return (
        <div className={cn(embed.images.length >= 2 && 'grid grid-cols-2', 'gap-2 mb-3')}>
          {embed.images.map((image) => (
            <Image
              type="post"
              key={image.thumb}
              src={image.thumb}
              alt={image.alt}
              classNames={{
                image: cn(embed.images.length >= 2 && 'h-48', 'rounded-lg w-full object-cover'),
              }}
            />
          ))}
        </div>
      );
    }
    case 'app.bsky.embed.video#view':
      return (
        <div className={cn('mb-3 w-full aspect-square', experiments.streamerMode && 'filter blur-md')}>
          <ReactPlayer
            url={embed.playlist}
            controls={true}
            width="100%"
            height="100%"
            muted={true}
            light={embed.thumbnail}
            config={{
              file: {
                attributes: {
                  preload: 'none',
                },
              },
            }}
          />
        </div>
      );
    case 'app.bsky.embed.external#view': {
      if (!embed.external.thumb) return null;
      return (
        <div className="mb-3 bg-neutral-800 rounded p-2">
          <a href={embed.external.uri} target="_blank" rel="noreferrer" className="hover:underline">
            {embed.external.title}
          </a>
          {embed.external.thumb && (
            <Image
              type="post"
              src={embed.external.uri}
              alt={embed.external.title}
              classNames={{
                image: 'rounded-lg w-full aspect-square object-cover',
              }}
            />
          )}
        </div>
      );
    }
    case 'app.bsky.embed.record#view': {
      const author = embed.record.$type === 'app.bsky.embed.record#viewRecord' ? embed.record.author : embed.record.creator;
      if (!author) {
        return <Debug value={embed.record} />;
      }
      if (isBlockedAuthor(author)) {
        return (
          <div className={cn('bg-white dark:bg-neutral-900 p-4 rounded-lg shadow')}>
            <div className="text-gray-800 dark:text-gray-200 mb-3">{t('blockedAuthor')}</div>
          </div>
        );
      }

      return (
        <div className={cn('bg-white dark:bg-neutral-900 p-4 rounded-lg shadow')}>
          {embed.record.$type === 'app.bsky.embed.record#viewRecord' && (
            <div className="flex items-center space-x-3 mb-2">
              {author.avatar && (
                <Image
                  type="avatar"
                  src={author.avatar}
                  alt={author.handle}
                  classNames={{ image: 'w-10 h-10 rounded-full' }}
                />
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  <Link to="/profile/$handle" params={{ handle: author.handle }}>
                    {author.displayName || author.handle}
                  </Link>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  <Link to="/profile/$handle" params={{ handle: author.handle }}>
                    <Handle handle={author.handle} />
                  </Link>
                  {' · '}
                  <Link
                    to="/profile/$handle/post/$postId"
                    params={{
                      handle: author.handle,
                      postId: embed.record.uri.split('/').pop()!,
                    }}
                  >
                    <TimeAgo date={embed.record.indexedAt} />
                  </Link>
                </div>
              </div>
            </div>
          )}
          {(() => {
            if (embed.record.$type === 'app.bsky.embed.record#viewRecord' && embed.record.text) {
              return (
                <p className="text-gray-800 dark:text-gray-200 mb-3">
                  {embed.record.facets ? (
                    <FacetedText text={embed.record.text} facets={embed.record.facets} key={embed.record.uri} />
                  ) : (
                    embed.record.text
                  )}
                </p>
              );
            }

            if (
              embed.record.$type === 'app.bsky.embed.record#viewRecord' &&
              embed.record.embeds &&
              embed.record.embeds.length >= 1
            ) {
              return <PostEmbed embed={embed.record.embeds?.[0]} />;
            }
            if (embed.record.$type === 'app.bsky.graph.defs#starterPackViewBasic') {
              return (
                <div className="text-gray-800 dark:text-gray-200">
                  <NotImplementedBox type={embed.$type} data={embed.record} />
                </div>
              );
            }

            return (
              <p className="text-gray-800 dark:text-gray-200 mb-3">
                {embed.record.facets ? (
                  <FacetedText text={embed.record.value.text} facets={embed.record.facets} key={embed.record.uri} />
                ) : (
                  embed.record.value.text
                )}
              </p>
            );
          })()}
        </div>
      );
    }
    case 'app.bsky.embed.recordWithMedia#view': {
      const images =
        embed.media.$type === 'app.bsky.embed.images#view'
          ? embed.media.images
          : embed.media.external?.thumb
            ? [
                {
                  thumb: embed.media.external?.uri ?? embed.media.external?.thumb,
                  alt: embed.media.external?.description,
                },
              ]
            : [];

      if (images.length === 0) break;

      return (
        <div className={cn(images.length >= 2 && 'grid grid-cols-2', 'gap-2 mb-3')}>
          {images.map((image) => (
            <Image
              type="post"
              key={image.thumb}
              src={image.thumb}
              alt={image.alt}
              classNames={{
                image: cn(images.length >= 2 && 'h-48', 'rounded-lg w-full object-cover'),
              }}
            />
          ))}
        </div>
      );
    }
  }

  // @ts-expect-error this is a catch-all for any embeds that are not implemented
  return <NotImplementedBox type={embed.$type} data={embed.record} />;
};
