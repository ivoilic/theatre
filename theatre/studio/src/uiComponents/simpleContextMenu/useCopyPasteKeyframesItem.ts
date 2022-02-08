import {useMemo} from 'react'
import {useVal} from '@theatre/react'
import getStudio from '@theatre/studio/getStudio'
import {useFrameStampPositionD} from '@theatre/studio/panels/SequenceEditorPanel/FrameStampPositionProvider'
import type {
  SequenceEditorTree_PrimitiveProp,
  SequenceEditorTree_PropWithChildren,
  SequenceEditorTree_SheetObject,
} from '@theatre/studio/panels/SequenceEditorPanel/layout/tree'
import {getCopiedKeyframes, getTracks} from '@theatre/studio/selectors'
import type {IContextMenuItem} from './useContextMenu'
import type {Keyframe} from '@theatre/core/projects/store/types/SheetState_Historic'
import type {DopeSheetSelection} from '@theatre/studio/panels/SequenceEditorPanel/layout/layout'

type LeafType =
  | SequenceEditorTree_SheetObject
  | SequenceEditorTree_PropWithChildren
  | SequenceEditorTree_PrimitiveProp

export const usePasteKeyframesItem = (
  leaf: LeafType,
): IContextMenuItem | null => {
  const [posInUnitSpace] = useVal(useFrameStampPositionD())
  const copiedKeyframes = getCopiedKeyframes()
  const totalKeyframes = useMemo(() => {
    return Object.values(copiedKeyframes).reduce((prev, curr) => {
      return prev + curr.length
    }, 0)
  }, [copiedKeyframes])

  return useMemo(() => {
    const {trackId, sheetObject} = leaf

    if (!trackId || !totalKeyframes) return null

    return {
      label: `Paste ${totalKeyframes} keyframe${totalKeyframes > 1 ? 's' : ''}`,
      callback: () => {
        getStudio().pasteKeyframes({
          trackId,
          sheetObject,
          keyframes: copiedKeyframes,
          posInUnitSpace,
        })
      },
    }
  }, [leaf, posInUnitSpace, copiedKeyframes, totalKeyframes])
}

export const useCopyKeyframesItem = ({
  leaf,
  selection,
  keyframe,
}: {
  leaf: LeafType
  selection?: DopeSheetSelection
  keyframe?: Keyframe
}): IContextMenuItem | null => {
  return useMemo(() => {
    const {sheetObject, trackId} = leaf
    const {address} = sheetObject

    if (!trackId) return null

    if (selection) {
      const {projectId, objectKey, sheetId} = address
      const {byTrackId} = selection.byObjectKey[objectKey]!

      const tracks = getTracks(projectId, sheetId)
      const {trackData = {}} = tracks?.[objectKey] || {}

      const selectedKeyframes = Object.keys(trackData).reduce((prev, key) => {
        const selectedKeyframeIds = Object.keys(
          byTrackId[key]?.byKeyframeId || {},
        )

        return {
          ...prev,
          [key]: trackData[key]!.keyframes.filter(
            ({id}) => selectedKeyframeIds.indexOf(id) > -1,
          ),
        }
      }, {})

      return {
        label: 'Copy selected keyframes',
        callback: () => {
          getStudio().transaction(({stateEditors}) => {
            stateEditors.studio.ahistoric.setKeyframesClipboard(
              selectedKeyframes,
            )
          })
        },
      }
    } else if (keyframe) {
      return {
        label: 'Copy keyframe',
        callback: () => {
          getStudio().transaction(({stateEditors}) => {
            stateEditors.studio.ahistoric.setKeyframesClipboard({
              [trackId]: [keyframe],
            })
          })
        },
      }
    }

    return null
  }, [leaf, selection, keyframe])
}
