import { forwardRef, useState } from 'react';
import { useTimeline } from '../lib/bluesky/hooks/useTimeline';
import { PostCard } from './PostCard';
import { useHotkeys } from 'react-hotkeys-hook';
import { useLike } from '../lib/bluesky/hooks/useLike';
import { useRepost } from '../lib/bluesky/hooks/useRepost';
import { useSettings } from '../hooks/useSetting';
import { Virtuoso } from 'react-virtuoso';
import { Loading } from './ui/loading';

export function Timeline({ columnNumber = 1 }: { columnNumber: number }) {
  const { columns } = useSettings();
  const selectedFeed = columns[columnNumber];
  const { data, isLoading, error, fetchNextPage } = useTimeline(selectedFeed);
  const like = useLike();
  const repost = useRepost();
  const posts = data?.pages.map((page) => page.feed).flat() ?? [];
  const [selectedPost, setSelectedPost] = useState<string | null>(posts?.[0]?.post.uri ?? null);
  const getPost = (uri: string | null) => (uri ? posts.find(({ post }) => post.uri === uri)?.post : null);
  const getNextPost = (uri: string | null) => {
    const index = posts.findIndex(({ post }) => post.uri === uri);
    return posts[index + 1];
  };
  const getPrevPost = (uri: string | null) => {
    const index = posts.findIndex(({ post }) => post.uri === uri);
    return posts[index - 1];
  };

  // like post
  useHotkeys(
    'l',
    () => {
      const post = getPost(selectedPost);
      if (!post?.viewer) return;

      like.mutate({ uri: post.uri, cid: post.cid, like: !post.viewer.like });
    },
    [selectedPost],
  );

  // repost post
  useHotkeys(
    't',
    () => {
      const post = getPost(selectedPost);
      if (!post) return;

      repost.mutate({ uri: post.uri, cid: post.cid });
    },
    [selectedPost],
  );

  // next post
  useHotkeys(
    'j',
    () => {
      const postUri = getNextPost(selectedPost)?.post.uri;
      if (!postUri) return;
      setSelectedPost(postUri);

      // scroll to the post
      const post = document.getElementById(postUri);
      if (post) {
        post.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [selectedPost],
  );

  // previous post
  useHotkeys(
    'k',
    () => {
      const postUri = getPrevPost(selectedPost)?.post.uri;
      if (!postUri) return;
      setSelectedPost(postUri);

      // scroll to the post
      const post = document.getElementById(postUri);
      if (post) {
        post.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [selectedPost],
  );

  // page down
  useHotkeys(
    'space',
    () => {
      window.scrollBy(0, window.innerHeight);
    },
    [],
  );

  if (isLoading) return <Loading />;

  if (error) {
    return <div className="text-red-500 text-center py-8">{error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="w-screen sm:w-full">
        <Virtuoso
          useWindowScroll
          totalCount={posts.length}
          endReached={() => fetchNextPage()}
          components={{
            List: forwardRef((props, ref) => <div ref={ref} {...props} className="flex flex-col gap-2" />),
          }}
          itemContent={(index: number) => <PostCard key={posts[index]?.post.uri} post={posts[index]?.post} />}
        />
      </div>
    </div>
  );
}
