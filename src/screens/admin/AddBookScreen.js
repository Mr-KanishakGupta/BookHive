import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  Menu, ChevronLeft, Camera, X, BookOpen, ChevronDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AdminColors } from '../../theme/colors';
import { createBook } from '../../services/bookService';

// ─── Option Lists ──────────────────────────────────────────────────────────
const GENRES = [
  'Academic', 'Technical', 'Reference', 'Research', 'General',
  'Gaming', 'Coding Languages', 'Story', 'Dark Fantasy',
  'Business', 'Law', 'Philosophy', 'Science Fiction',
  'Self-Help', 'History', 'Art & Design', 'Medical',
];

const INNER_GENRES = {
  Academic: ['Algorithms', 'Data Structures', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Other'],
  Technical: ['Programming', 'Networking', 'Operating Systems', 'Databases', 'Web Development', 'AI/ML', 'Robotics', 'Cloud Computing', 'Other'],
  Reference: ['Dictionary', 'Encyclopedia', 'Manual', 'Handbook', 'Other'],
  Research: ['Thesis', 'Journal', 'Conference Paper', 'Monograph', 'Other'],
  General: ['Fiction', 'Non-Fiction', 'Biography', 'Autobiography', 'Travel', 'Other'],
  Gaming: ['Game Design', 'Game Development', 'Esports', 'Game Theory', 'Board Games', 'RPG', 'Other'],
  'Coding Languages': ['Python', 'Java', 'JavaScript', 'C/C++', 'Rust', 'Go', 'Kotlin', 'Swift', 'Ruby', 'TypeScript', 'Other'],
  Story: ['Thriller', 'Mystery', 'Romance', 'Adventure', 'Horror', 'Drama', 'Comedy', 'Mythology', 'Other'],
  'Dark Fantasy': ['Epic Fantasy', 'Gothic', 'Grimdark', 'Supernatural', 'Paranormal', 'Dystopian', 'Other'],
  Business: ['Entrepreneurship', 'Marketing', 'Finance', 'Management', 'Leadership', 'Startups', 'Economics', 'Other'],
  Law: ['Constitutional', 'Criminal', 'Corporate', 'International', 'Civil', 'Cyber Law', 'Human Rights', 'Other'],
  Philosophy: ['Ethics', 'Logic', 'Metaphysics', 'Epistemology', 'Political Philosophy', 'Existentialism', 'Eastern Philosophy', 'Other'],
  'Science Fiction': ['Space Opera', 'Cyberpunk', 'Time Travel', 'Post-Apocalyptic', 'Hard Sci-Fi', 'Alien', 'Other'],
  'Self-Help': ['Productivity', 'Mindfulness', 'Personal Finance', 'Relationships', 'Mental Health', 'Motivation', 'Other'],
  History: ['Ancient', 'Medieval', 'Modern', 'World Wars', 'Indian History', 'Art History', 'Other'],
  'Art & Design': ['Graphic Design', 'UI/UX', 'Photography', 'Architecture', 'Fine Arts', 'Fashion', 'Other'],
  Medical: ['Anatomy', 'Pharmacology', 'Surgery', 'Nursing', 'Public Health', 'Pathology', 'Other'],
};

const DEPARTMENTS = [
  'Independent',
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Information Science',
  'Civil Engineering',
  'Electrical Engineering',
];

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Other'];

// ─── Component ─────────────────────────────────────────────────────────────
const AddBookScreen = ({ navigation }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [rearImage, setRearImage] = useState(null);

  // Dropdown visibility
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showInnerGenreDropdown, setShowInnerGenreDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const [form, setForm] = useState({
    title: '',
    author: '',
    genre: '',
    innerGenre: '',
    department: '',
    totalCopies: '',
    cost: '',
    year: new Date().getFullYear().toString(),
    language: '',
    description: '',
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Reset innerGenre when genre changes
    if (field === 'genre') {
      setForm(prev => ({ ...prev, genre: value, innerGenre: '' }));
    }
  };

  // ─── Image Picker ──────────────────────────────────────────────────────
  const pickImage = async (isFront) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.3,  // Low quality to keep base64 size under Firestore 1MB limit
    });

    if (!result.canceled && result.assets?.length > 0) {
      if (isFront) setFrontImage(result.assets[0].uri);
      else setRearImage(result.assets[0].uri);
    }
  };

  // ─── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.title.trim()) return 'Book title is required';
    if (!form.author.trim()) return 'Author name is required';
    if (!form.genre) return 'Please select a genre';
    if (!form.innerGenre) return 'Please select a sub-genre';
    if (!form.department) return 'Please select a department';
    if (!form.totalCopies || Number(form.totalCopies) < 1) return 'Total copies must be at least 1';
    if (!form.cost || Number(form.cost) < 0) return 'Enter a valid price';
    if (!form.year || Number(form.year) < 1900) return 'Enter a valid year';
    if (!form.language) return 'Please select a language';
    return null;
  };

  // ─── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setIsSubmitting(true);
    try {
      const bookData = {
        ...form,
        totalCopies: Number(form.totalCopies),
        cost: Number(form.cost),
        year: Number(form.year),
      };

      const created = await createBook(bookData, frontImage, rearImage);
      Alert.alert(
        '✅ Book Added',
        `"${created.title}" has been added successfully.\n\nBook Code: ${created.bookCode}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error adding book:', err);
      Alert.alert('Error', err.message || 'Failed to add book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Dropdown Renderer ─────────────────────────────────────────────────
  const renderDropdown = (options, selectedValue, onSelect, visible, onToggle) => (
    <View>
      <TouchableOpacity style={styles.dropdownTrigger} onPress={onToggle}>
        <Text style={[styles.dropdownTriggerText, !selectedValue && styles.placeholder]}>
          {selectedValue || 'Select...'}
        </Text>
        <ChevronDown size={18} color={AdminColors.textMuted} />
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownList}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownOption, selectedValue === opt && styles.dropdownOptionActive]}
              onPress={() => { onSelect(opt); onToggle(); }}
            >
              <Text style={[styles.dropdownOptionText, selectedValue === opt && styles.dropdownOptionActiveText]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AdminColors.bgGrey} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={AdminColors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Add New Book</Text>
          <Text style={styles.headerSub}>Fill in the details below. Book code will be generated automatically.</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Images Section ──────────────────────────────── */}
          <Text style={styles.sectionTitle}>Book Images</Text>
          <View style={styles.imageRow}>
            {/* Front Image */}
            <View style={styles.imagePickerContainer}>
              <Text style={styles.imageLabel}>Front Cover</Text>
              {frontImage ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: frontImage }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setFrontImage(null)}>
                    <X size={14} color={AdminColors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage(true)}>
                  <Camera size={28} color={AdminColors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Rear Image */}
            <View style={styles.imagePickerContainer}>
              <Text style={styles.imageLabel}>Rear Cover</Text>
              {rearImage ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: rearImage }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setRearImage(null)}>
                    <X size={14} color={AdminColors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage(false)}>
                  <Camera size={28} color={AdminColors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ─── Basic Details ───────────────────────────────── */}
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Book Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Introduction to Algorithms"
              placeholderTextColor={AdminColors.textMuted}
              value={form.title}
              onChangeText={(v) => updateField('title', v)}
            />

            <Text style={styles.label}>Author <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Thomas H. Cormen"
              placeholderTextColor={AdminColors.textMuted}
              value={form.author}
              onChangeText={(v) => updateField('author', v)}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of the book..."
              placeholderTextColor={AdminColors.textMuted}
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* ─── Classification ──────────────────────────────── */}
          <Text style={styles.sectionTitle}>Classification</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Genre <Text style={styles.required}>*</Text></Text>
            {renderDropdown(
              GENRES,
              form.genre,
              (v) => updateField('genre', v),
              showGenreDropdown,
              () => {
                setShowGenreDropdown(!showGenreDropdown);
                setShowInnerGenreDropdown(false);
                setShowDeptDropdown(false);
                setShowLangDropdown(false);
              }
            )}

            <Text style={[styles.label, { marginTop: 14 }]}>Sub-Genre <Text style={styles.required}>*</Text></Text>
            {renderDropdown(
              form.genre ? (INNER_GENRES[form.genre] || []) : [],
              form.innerGenre,
              (v) => updateField('innerGenre', v),
              showInnerGenreDropdown,
              () => {
                if (!form.genre) {
                  Alert.alert('Select Genre First', 'Please select a genre before choosing a sub-genre.');
                  return;
                }
                setShowInnerGenreDropdown(!showInnerGenreDropdown);
                setShowGenreDropdown(false);
                setShowDeptDropdown(false);
                setShowLangDropdown(false);
              }
            )}

            <Text style={[styles.label, { marginTop: 14 }]}>Department <Text style={styles.required}>*</Text></Text>
            {renderDropdown(
              DEPARTMENTS,
              form.department,
              (v) => updateField('department', v),
              showDeptDropdown,
              () => {
                setShowDeptDropdown(!showDeptDropdown);
                setShowGenreDropdown(false);
                setShowInnerGenreDropdown(false);
                setShowLangDropdown(false);
              }
            )}

            <Text style={[styles.label, { marginTop: 14 }]}>Language <Text style={styles.required}>*</Text></Text>
            {renderDropdown(
              LANGUAGES,
              form.language,
              (v) => updateField('language', v),
              showLangDropdown,
              () => {
                setShowLangDropdown(!showLangDropdown);
                setShowGenreDropdown(false);
                setShowInnerGenreDropdown(false);
                setShowDeptDropdown(false);
              }
            )}
          </View>

          {/* ─── Inventory & Pricing ─────────────────────────── */}
          <Text style={styles.sectionTitle}>Inventory & Pricing</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Total Copies <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  placeholderTextColor={AdminColors.textMuted}
                  keyboardType="numeric"
                  value={form.totalCopies}
                  onChangeText={(v) => updateField('totalCopies', v)}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Available Copies</Text>
                <View style={[styles.input, styles.disabledInput]}>
                  <Text style={styles.disabledText}>
                    {form.totalCopies ? form.totalCopies : '—'}
                  </Text>
                </View>
                <Text style={styles.helperText}>Auto-set to total on creation</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Price (₹) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 450"
                  placeholderTextColor={AdminColors.textMuted}
                  keyboardType="numeric"
                  value={form.cost}
                  onChangeText={(v) => updateField('cost', v)}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Year <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2024"
                  placeholderTextColor={AdminColors.textMuted}
                  keyboardType="numeric"
                  value={form.year}
                  onChangeText={(v) => updateField('year', v)}
                />
              </View>
            </View>
          </View>

          {/* ─── Auto-generated Info ────────────────────────── */}
          <View style={styles.infoBox}>
            <BookOpen size={18} color={AdminColors.blue} />
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: '700' }}>Book Code</Text> will be automatically generated based on the year, genre, and sub-genre you select. You don't need to enter it manually.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Submit Button ────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={AdminColors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Add Book</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AdminColors.bgGrey,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: AdminColors.bgGrey,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AdminColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AdminColors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: AdminColors.textSecondary,
    marginTop: 2,
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AdminColors.navy,
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: AdminColors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AdminColors.textPrimary,
    marginBottom: 6,
  },
  required: {
    color: AdminColors.red,
  },
  input: {
    backgroundColor: AdminColors.bgGrey,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: AdminColors.textPrimary,
    borderWidth: 1,
    borderColor: AdminColors.border,
    marginBottom: 4,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: '#EAECEF',
    justifyContent: 'center',
  },
  disabledText: {
    fontSize: 14,
    color: AdminColors.textSecondary,
  },
  helperText: {
    fontSize: 11,
    color: AdminColors.textMuted,
    marginTop: 2,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  halfField: {
    flex: 1,
  },

  // ─── Dropdowns ───────────────────────────────
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AdminColors.bgGrey,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: AdminColors.border,
    marginBottom: 4,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: AdminColors.textPrimary,
  },
  placeholder: {
    color: AdminColors.textMuted,
  },
  dropdownList: {
    backgroundColor: AdminColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AdminColors.border,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },
  dropdownOptionActive: {
    backgroundColor: AdminColors.blueLight,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: AdminColors.textPrimary,
  },
  dropdownOptionActiveText: {
    color: AdminColors.navy,
    fontWeight: '600',
  },

  // ─── Images ──────────────────────────────────
  imageRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
  },
  imagePickerContainer: {
    flex: 1,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AdminColors.textSecondary,
    marginBottom: 6,
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: AdminColors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AdminColors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: AdminColors.textMuted,
    marginTop: 6,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Info Box ────────────────────────────────
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AdminColors.blueLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: AdminColors.textSecondary,
    lineHeight: 19,
  },

  // ─── Footer ──────────────────────────────────
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    backgroundColor: AdminColors.white,
    borderTopWidth: 1,
    borderTopColor: AdminColors.border,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AdminColors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: AdminColors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AdminColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: AdminColors.white,
  },
});

export default AddBookScreen;
