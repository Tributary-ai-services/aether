import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';
import { mockSkills } from '../../data/mockData.js';

export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.skills.list({ size: 100 });
      const data = response?.data || response;
      const skills = Array.isArray(data) ? data : (data?.skills || data?.items || []);
      if (skills.length === 0) {
        return mockSkills;
      }
      return skills;
    } catch (error) {
      // Fallback to mock skills if API is unavailable
      return mockSkills;
    }
  }
);

const skillsSlice = createSlice({
  name: 'skills',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = mockSkills;
      });
  },
});

export default skillsSlice.reducer;
