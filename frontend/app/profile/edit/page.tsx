'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { developersApi } from '@/lib/api';
import type { Developer } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Input } from '@heroui/react/input';
import { Skeleton } from '@heroui/react/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { User, ArrowLeft, Plus, X, Save, Code, Briefcase, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

interface ExperienceForm {
  title: string;
  company: string;
  fromDate: string;
  toDate: string;
  description: string;
  isCurrentJob: boolean;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Experiences state
  const [experiences, setExperiences] = useState<ExperienceForm[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await developersApi.getMe();
        setDeveloper(data);
        setProfilePicture(data.profilePicture);
        setSkills(data.skills.map((s) => s.name));
        setExperiences(
          data.experiences.map((exp) => ({
            title: exp.title,
            company: exp.company,
            fromDate: exp.fromDate,
            toDate: exp.toDate || '',
            description: exp.description || '',
            isCurrentJob: !exp.toDate,
          }))
        );
      } catch (err: any) {
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setIsUploadingPicture(true);
    setError('');

    try {
      const updatedUser = await developersApi.uploadProfilePicture(file);
      setProfilePicture(updatedUser.profilePicture);
      setSuccessMessage('Profile picture updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        title: '',
        company: '',
        fromDate: '',
        toDate: '',
        description: '',
        isCurrentJob: false,
      },
    ]);
  };

  const handleRemoveExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (
    index: number,
    field: keyof ExperienceForm,
    value: string | boolean
  ) => {
    const updated = [...experiences];
    if (field === 'isCurrentJob') {
      updated[index] = {
        ...updated[index],
        isCurrentJob: value as boolean,
        toDate: value ? '' : updated[index].toDate,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setExperiences(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate experiences
      const hasInvalidExperience = experiences.some(
        (exp) =>
          !exp.title.trim() ||
          !exp.company.trim() ||
          !exp.fromDate ||
          (!exp.isCurrentJob && !exp.toDate)
      );

      if (hasInvalidExperience) {
        setError('Please fill in all required fields for experiences');
        setIsSaving(false);
        return;
      }

      // Save skills
      await developersApi.updateMySkills({ skills });

      // Save experiences
      const experiencesDto = experiences.map((exp) => ({
        title: exp.title.trim(),
        company: exp.company.trim(),
        fromDate: exp.fromDate,
        toDate: exp.isCurrentJob ? null : exp.toDate,
        description: exp.description.trim() || '',
      }));

      await developersApi.updateMyExperiences({ experiences: experiencesDto });

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        router.push(`/developers/${user?.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Button
          variant="tertiary"
          onClick={() => router.push(`/developers/${user?.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
      </div>

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <Avatar className="h-16 w-16 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
                {profilePicture ? (
                  <AvatarImage src={`${API_URL}${profilePicture}`} alt={developer?.name} className="object-cover" />
                ) : (
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <label
                htmlFor="profile-picture-upload"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#1877F2] dark:bg-[#2D88FF] text-white flex items-center justify-center cursor-pointer hover:bg-[#1565D8] dark:hover:bg-[#1E7FFF] transition-colors shadow-md"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="sr-only"
                  disabled={isUploadingPicture}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {developer?.name}
                {isUploadingPicture && ' • Uploading...'}
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          )}

          {/* Skills Section */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5" />
                Skills
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1877F2]/10 dark:bg-[#2D88FF]/20 text-[#1877F2] dark:text-[#2D88FF] rounded-full text-sm font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="ml-1 hover:bg-[#1877F2]/20 dark:hover:bg-[#2D88FF]/30 rounded-full p-0.5"
                          aria-label="Remove skill"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Skill Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add a skill (e.g., TypeScript)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    variant="secondary"
                    isDisabled={!newSkill.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Work Experience
                </h2>
                <Button type="button" onClick={handleAddExperience} variant="secondary" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {experiences.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                  No work experience added yet. Click "Add Experience" to get started.
                </p>
              ) : (
                <div className="space-y-6">
                  {experiences.map((exp, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          Experience {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          aria-label="Remove experience"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">
                            Job Title <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="e.g., Senior Software Engineer"
                            value={exp.title}
                            onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">
                            Company <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="e.g., Acme Corp"
                            value={exp.company}
                            onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="date"
                            value={exp.fromDate}
                            onChange={(e) => handleExperienceChange(index, 'fromDate', e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">
                            End Date {!exp.isCurrentJob && <span className="text-red-500">*</span>}
                          </label>
                          <Input
                            type="date"
                            value={exp.toDate}
                            onChange={(e) => handleExperienceChange(index, 'toDate', e.target.value)}
                            disabled={exp.isCurrentJob}
                            required={!exp.isCurrentJob}
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={exp.isCurrentJob}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleExperienceChange(index, 'isCurrentJob', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-[#1877F2] focus:ring-[#1877F2]"
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          I currently work here
                        </span>
                      </label>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Description (optional)</label>
                        <textarea
                          placeholder="Describe your responsibilities and achievements..."
                          value={exp.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            handleExperienceChange(index, 'description', e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1877F2] dark:focus:ring-[#2D88FF]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => router.push(`/developers/${user?.id}`)}
              isDisabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isDisabled={isSaving}
              className="bg-[#1877F2] dark:bg-[#2D88FF] text-white"
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
