/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { useEffect, useCallback, useRef } from 'react';

/**
 * Internal dependencies
 */
import { useAPI, useConfig } from '../';
import useUploadVideoFrame from './utils/useUploadVideoFrame';
import useMediaReducer from './useMediaReducer';
import useUploadMedia from './useUploadMedia';
import Context from './context';
import { getResourceFromAttachment } from './utils';

function MediaProvider({ children }) {
  const { state, actions } = useMediaReducer();
  const { media, pagingNum, mediaType, searchTerm } = state;
  const {
    fetchMediaStart,
    fetchMediaSuccess,
    fetchMediaError,
    resetFilters,
    setMedia,
    setMediaType,
    setSearchTerm,
    setNextPage,
    updateMediaElement,
    deleteMediaElement,
  } = actions;
  const {
    actions: { getMedia },
  } = useAPI();
  const fetchMedia = useCallback(
    ({ pagingNum: p = 1, mediaType: currentMediaType } = {}, callback) => {
      fetchMediaStart({ pagingNum: p });
      getMedia({ mediaType: currentMediaType, searchTerm, pagingNum: p })
        .then(({ data, headers }) => {
          const totalPages = parseInt(headers.get('X-WP-TotalPages'));
          const mediaArray = data.map(getResourceFromAttachment);
          callback({
            media: mediaArray,
            mediaType: currentMediaType,
            searchTerm,
            pagingNum: p,
            totalPages,
          });
        })
        .catch(fetchMediaError);
    },
    [fetchMediaError, fetchMediaStart, getMedia, searchTerm]
  );
  const { uploadMedia, isUploading } = useUploadMedia({
    media,
    setMedia,
  });
  const { uploadVideoFrame } = useUploadVideoFrame({
    updateMediaElement,
  });
  const {
    allowedMimeTypes: { video: allowedVideoMimeTypes },
  } = useConfig();

  const resetWithFetch = useCallback(() => {
    resetFilters();
    if (!mediaType && !searchTerm && pagingNum === 1) {
      fetchMedia({ mediaType }, fetchMediaSuccess);
    }
  }, [
    fetchMedia,
    fetchMediaSuccess,
    mediaType,
    pagingNum,
    resetFilters,
    searchTerm,
  ]);

  useEffect(() => {
    fetchMedia({ pagingNum, mediaType }, fetchMediaSuccess);
  }, [fetchMedia, fetchMediaSuccess, mediaType, pagingNum, searchTerm]);

  const processing = useRef([]);
  const processed = useRef([]);
  const uploadVideoPoster = useCallback(
    (id, src) => {
      const process = async () => {
        if (processed.current.includes(id) || processing.current.includes(id)) {
          return;
        }
        processing.current.push(id);
        try {
          await uploadVideoFrame(id, src);
          processed.current.push(id);
        } finally {
          processing.current = processing.current.filter((e) => e !== id);
        }
      };
      process();
    },
    [uploadVideoFrame]
  );

  const processor = useCallback(
    ({ mimeType, posterId, id, src, local }) => {
      const process = async () => {
        if (
          allowedVideoMimeTypes.includes(mimeType) &&
          !local &&
          !posterId &&
          id
        ) {
          await uploadVideoPoster(id, src);
        }
      };
      process();
    },
    [allowedVideoMimeTypes, uploadVideoPoster]
  );

  useEffect(() => {
    const looper = async () => {
      await media.reduce((accumulatorPromise, el) => {
        return accumulatorPromise.then(() => el && processor(el));
      }, Promise.resolve());
    };
    if (media) {
      looper();
    }
  }, [media, mediaType, searchTerm, processor]);

  const context = {
    state: { ...state, isUploading },
    actions: {
      setNextPage,
      setMediaType,
      setSearchTerm,
      resetFilters,
      uploadMedia,
      resetWithFetch,
      uploadVideoPoster,
      deleteMediaElement,
      updateMediaElement,
    },
  };

  return <Context.Provider value={context}>{children}</Context.Provider>;
}

MediaProvider.propTypes = {
  children: PropTypes.node,
};

export default MediaProvider;
