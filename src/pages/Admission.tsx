import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useStudents, AdmissionFormData } from '@/hooks/useStudents';
import { CLASS_LIST_DETAILED, ACADEMIC_YEARS, Term, Gender } from '@/types';
import { PhotoUpload } from '@/components/students/PhotoUpload';
import { UserPlus, Check, Printer, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Student } from '@/types';
import { studentAdmissionSchema, validateInput } from '@/lib/validations';
import { printReceipt } from '@/utils/printReceipt';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

export default function Admission() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addStudent, schoolId } = useStudents();
  const { settings: schoolSettings } = useSchoolSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newStudent, setNewStudent] = useState<Student | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<AdmissionFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    classId: '',
    className: '',
    guardianName: '',
    address: '',
    phoneContact: '',
    email: '',
    admissionFee: 25000,
    amountPaid: 0,
    academicYear: '2024/2025',
    term: 'second',
  });

  const handleInputChange = (field: keyof AdmissionFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClassChange = (classId: string) => {
    const selectedClass = CLASS_LIST_DETAILED.find((c) => c.id === classId);
    if (selectedClass) {
      setFormData((prev) => ({
        ...prev,
        classId,
        className: selectedClass.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data using Zod schema
    const validation = validateInput(studentAdmissionSchema, {
      ...formData,
      photoUrl: photoUrl || '',
    });

    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: (validation as { success: false; error: string }).error,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const studentData = {
        ...formData,
        photoUrl: photoUrl || undefined,
      };
      const result = await addStudent(studentData);
      if (result.student) {
        setNewStudent(result.student);
        setShowSuccess(true);
        
        toast({
          title: 'Student Admitted Successfully!',
          description: `${result.student.fullName} has been admitted with admission number ${result.student.admissionNumber}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to admit student. Please try again.',
          variant: 'destructive',
        });
      }

      // Reset form
      setFormData({
        fullName: '',
        dateOfBirth: '',
        gender: 'male',
        classId: '',
        className: '',
        guardianName: '',
        address: '',
        phoneContact: '',
        email: '',
        admissionFee: 25000,
        amountPaid: 0,
        academicYear: '2024/2025',
        term: 'second',
      });
      setPhotoUrl(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to admit student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrintReceipt = () => {
    if (!newStudent || !schoolSettings) {
      toast({ title: "Error", description: "Unable to print receipt. Missing data.", variant: "destructive" });
      return;
    }

    const className = CLASS_LIST_DETAILED.find(c => c.id === newStudent.classId)?.name || newStudent.className || newStudent.classId;
    const amountPaid = formData.amountPaid || 0;
    const totalFee = newStudent.admissionFee || formData.admissionFee || 0;
    const balance = totalFee - amountPaid;

    printReceipt({
      studentName: newStudent.fullName,
      admissionNumber: newStudent.admissionNumber,
      className: className,
      guardianName: formData.guardianName || "N/A",
      phoneContact: formData.phoneContact || "N/A",
      amountPaid: amountPaid,
      totalFee: totalFee,
      balance: balance,
      term: schoolSettings.term || formData.term || "First Term",
      academicYear: schoolSettings.academic_year || formData.academicYear || new Date().getFullYear().toString(),
      paymentDate: new Date().toLocaleDateString(),
      paymentMethod: "Cash",
    }, schoolSettings);

    toast({ title: "Receipt Printed", description: "Admission receipt has been sent to print." });
  };

  const balance = formData.admissionFee - formData.amountPaid;

  return (
    <MainLayout title="Student Admission" subtitle="Register a new student">
      <div className="max-w-4xl animate-slide-up">
        {!schoolId && (
          <div className="mb-6 p-4 rounded-lg border border-warning bg-warning/10">
            <p className="text-sm text-warning-foreground font-medium">
              ⚠️ School setup incomplete. Please complete your school registration before admitting students.
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary mt-2"
              onClick={() => navigate('/settings')}
            >
              Go to Settings →
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Section */}
          <div className="form-section">
            <PhotoUpload
              currentPhotoUrl={photoUrl || undefined}
              onPhotoChange={setPhotoUrl}
            />
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter student's full name"
                  required
                  className="input-focus"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                  className="input-focus"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: Gender) => handleInputChange('gender', value)}
                >
                  <SelectTrigger className="input-focus">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="form-section">
            <h3 className="text-lg font-semibold text-foreground mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.classId} onValueChange={handleClassChange}>
                  <SelectTrigger className="input-focus">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LIST_DETAILED.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(value) => handleInputChange('academicYear', value)}
                >
                  <SelectTrigger className="input-focus">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="term">Term *</Label>
                <Select
                  value={formData.term}
                  onValueChange={(value: Term) => handleInputChange('term', value)}
                >
                  <SelectTrigger className="input-focus">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Term</SelectItem>
                    <SelectItem value="second">Second Term</SelectItem>
                    <SelectItem value="third">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="form-section">
            <h3 className="text-lg font-semibold text-foreground mb-4">Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianName">Guardian Name *</Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => handleInputChange('guardianName', e.target.value)}
                  placeholder="Enter guardian's full name"
                  required
                  className="input-focus"
                />
              </div>
              <div>
                <Label htmlFor="phoneContact">Phone Contact *</Label>
                <Input
                  id="phoneContact"
                  type="tel"
                  value={formData.phoneContact}
                  onChange={(e) => handleInputChange('phoneContact', e.target.value)}
                  placeholder="+234 800 000 0000"
                  required
                  className="input-focus"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="guardian@email.com"
                  className="input-focus"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full residential address"
                  required
                  className="input-focus"
                />
              </div>
            </div>
          </div>

          {/* Fee Payment Section */}
          <div className="form-section">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Fee Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="admissionFee">Total Fee Payable (₦) *</Label>
                <Input
                  id="admissionFee"
                  type="number"
                  value={formData.admissionFee}
                  onChange={(e) => handleInputChange('admissionFee', Number(e.target.value))}
                  placeholder="25000"
                  required
                  className="input-focus"
                />
              </div>
              <div>
                <Label htmlFor="amountPaid">Amount Paid (₦)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) => handleInputChange('amountPaid', Number(e.target.value))}
                  placeholder="0"
                  min={0}
                  max={formData.admissionFee}
                  className="input-focus"
                />
              </div>
              <div>
                <Label>Balance (₦)</Label>
                <Input
                  value={formatCurrency(balance)}
                  readOnly
                  className={`input-focus ${balance > 0 ? 'text-destructive' : 'text-green-600'} font-semibold`}
                />
              </div>
            </div>
            {balance > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Remaining balance of {formatCurrency(balance)} will be recorded for future payment.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/students')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? 'Processing...' : 'Admit Student'}
            </Button>
          </div>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-center">Admission Successful!</DialogTitle>
            <DialogDescription className="text-center">
              The student has been successfully admitted to the school.
            </DialogDescription>
          </DialogHeader>
          
          {newStudent && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admission Number:</span>
                <span className="font-semibold">{newStudent.admissionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student Name:</span>
                <span className="font-medium">{newStudent.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class:</span>
                <span className="font-medium">{newStudent.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Fee:</span>
                <span className="font-medium">{formatCurrency(newStudent.admissionFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(formData.amountPaid)}</span>
              </div>
              {balance > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-medium text-destructive">{formatCurrency(balance)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSuccess(false)}
            >
              Add Another
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSuccess(false);
                navigate('/students');
              }}
            >
              View Students
            </Button>
            <Button
              className="flex-1 bg-gradient-primary"
              onClick={handlePrintReceipt}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
