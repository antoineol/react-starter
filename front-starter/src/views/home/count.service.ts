import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { wait } from '../../common/utils/app.utils';
import { AppThunk, RootState } from '../../core/redux/store';

interface CountState {
  value: number;
  loading?: boolean;
  error?: any;
}

const initialState: CountState = {
  value: 0,
};

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const incrementAsync = createAsyncThunk(
  'count/incrementAsync',
  async (arg, thunkAPI) => {
    await wait(400);
    return 1;
  }
);

const countSlice = createSlice({
  name: 'count',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    incrementCount: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    changeCount: (state, action: PayloadAction<number>) => {
      state.value = action.payload;
    },
    doubleCount: (state) => {
      state.value *= 2;
    },
  },
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk or in other slices.
  extraReducers: (builder) => {
    builder
      .addCase(incrementAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(incrementAsync.fulfilled, (state, action) => {
        state.value += action.payload;
        state.loading = false;
      })
      .addCase(incrementAsync.rejected, (state, action) => {
        state.error = action.error;
        state.loading = false;
      });
  },
});

export const { incrementCount, changeCount, doubleCount } = countSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useAppSelector((state: RootState) => state.counter.value)`
export const selectCount = (state: RootState) => state.counter.value;
export const selectCountLoading = (state: RootState) => state.counter.loading;
export const selectCountError = (state: RootState) => state.counter.error;

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
export const incrementIfOdd = (amount: number): AppThunk => (
  dispatch,
  getState
) => {
  const currentValue = selectCount(getState());
  // await wait(400); // TODO works?
  if (currentValue % 2 === 1) {
    dispatch(changeCount(amount));
  }
};

// To add to src/core/redux/store.ts
export const countReducer = countSlice.reducer;
