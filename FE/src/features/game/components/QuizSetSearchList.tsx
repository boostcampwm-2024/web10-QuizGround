import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QuizPreview } from '@/components/QuizPreview';
import { getQuizSetList } from '@/api/rest/quizApi';

type QuizSet = {
  id: string;
  title: string;
  category: string;
  quizCount: number;
};

type Params = {
  search: string;
  onClick: (quizSet: QuizSet) => void;
};

const SEARCH_COUNT = 10;

const QuizSetSearchList = ({ onClick, search }: Params) => {
  // api로 수정시
  const fetchPosts = async ({ pageParam = '' }) => {
    const data = await getQuizSetList('', pageParam, SEARCH_COUNT, search);
    if (!data) {
      throw new Error('Failed to fetch quiz set list');
    }
    return {
      data: data.quizSetList,
      nextPage: data.paging.nextCursor || '',
      hasMore: data.paging.hasNextPage
    };
  };

  const [selectedQuizSet, setSelectedQuizSet] = useState<null | QuizSet>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: [search],
      queryFn: fetchPosts,
      initialPageParam: '',
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined)
    });

  const observerRef = useRef<null | HTMLDivElement>(null);

  const onIntersect = useCallback<IntersectionObserverCallback>(
    (entries) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    });

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [onIntersect]);

  if (isLoading) return;
  <div className="flex justify-center items-center h-full">
    <p>Loading...</p>
  </div>;
  if (isError)
    return (
      <div className="flex justify-center items-center h-full">
        <p>Error fetching data.</p>
      </div>
    );
  if (data?.pages[0].data.length === 0)
    return (
      <div className="flex justify-center items-center h-full">
        <span className="font-bold">{search}</span>와(과) 일치하는 검색결과가 없습니다
      </div>
    );

  return (
    <>
      {data?.pages.map((page) =>
        page?.data.map((e) => (
          <div
            className="mb-2 rounded-m bg-white"
            onClick={() => {
              setSelectedQuizSet(e);
              onClick(e);
            }}
            key={e.id}
            style={{
              border: 'solid 2px ' + (selectedQuizSet?.id === e.id ? 'lightgreen' : 'white')
            }}
          >
            <QuizPreview title={e.title} description={e.category} />
          </div>
        ))
      )}
      <div ref={observerRef} className="flex justify-center">
        {(isFetchingNextPage || hasNextPage) && (
          <div className="inline-block m-2">
            <div className="w-4 h-4 border-4 border-blue-500 border-dotted rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuizSetSearchList;
