'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UploadFormProps {
	onUploadComplete: () => void;
}

const UploadForm = ({ onUploadComplete }: UploadFormProps) => {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [message, setMessage] = useState('');
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = useCallback((selectedFile: File) => {
		if (selectedFile && selectedFile.type === 'text/csv') {
			setFile(selectedFile);
			setMessage('');
		} else {
			setMessage('Please select a valid CSV file.');
		}
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleFileChange(e.target.files[0]);
		}
	};

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const droppedFiles = e.dataTransfer.files;
			if (droppedFiles.length > 0) {
				handleFileChange(droppedFiles[0]);
			}
		},
		[handleFileChange]
	);

	const handleSubmit = async () => {
		if (!file) {
			setMessage('Please select a file to upload.');
			return;
		}

		setUploading(true);
		setUploadProgress(0);
		setMessage('Uploading...');

		const formData = new FormData();
		formData.append('file', file);

		try {
			// Simulate progress
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 10, 90));
			}, 200);

			const res = await fetch('/api/ingest', {
				method: 'POST',
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			// Check if response is ok before trying to parse JSON
			if (!res.ok) {
				const errorText = await res.text();
				setMessage(
					`Upload failed: ${res.status} ${res.statusText} - ${errorText}`
				);
				setUploadProgress(0);
				return;
			}

			// Try to parse JSON response
			let data;
			try {
				const responseText = await res.text();
				if (!responseText.trim()) {
					throw new Error('Empty response from server');
				}
				data = JSON.parse(responseText);
			} catch (parseError) {
				setMessage(
					`Upload error: Invalid response from server - ${
						parseError instanceof Error
							? parseError.message
							: 'Unknown parsing error'
					}`
				);
				setUploadProgress(0);
				return;
			}

			if (data.error) {
				setMessage(`Upload failed: ${data.error}`);
				setUploadProgress(0);
			} else {
				setMessage(
					`Upload successful! Ingested ${
						data.rows_ingested || 0
					} rows.`
				);
				onUploadComplete();
				// Reset after success
				setTimeout(() => {
					setFile(null);
					setUploadProgress(0);
					setMessage('');
				}, 3000);
			}
		} catch (error) {
			setMessage(
				`Upload error: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
			setUploadProgress(0);
		} finally {
			setUploading(false);
		}
	};

	const openFileSelector = () => {
		fileInputRef.current?.click();
	};

	const getStatusIcon = () => {
		if (uploading)
			return (
				<Loader2 className="h-5 w-5 animate-spin text-geo-accent-blue" />
			);
		if (message.includes('successful'))
			return <CheckCircle className="h-5 w-5 text-geo-success" />;
		if (message.includes('error') || message.includes('failed'))
			return <AlertCircle className="h-5 w-5 text-geo-error" />;
		return null;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Upload className="h-5 w-5 text-geo-accent-blue" />
						Upload CSV Data
					</CardTitle>
					<CardDescription>
						Upload your GPS tracking data in CSV format to generate
						demand forecasts
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Drag & Drop Zone */}
					<motion.div
						className={`geo-dropzone cursor-pointer ${
							isDragging ? 'drag-over' : ''
						}`}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onClick={openFileSelector}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						transition={{
							type: 'spring',
							stiffness: 400,
							damping: 25,
						}}
					>
						<div className="flex flex-col items-center justify-center text-center">
							<motion.div
								animate={{
									y: isDragging ? -10 : 0,
									scale: isDragging ? 1.1 : 1,
								}}
								transition={{
									type: 'spring',
									stiffness: 300,
									damping: 20,
								}}
							>
								{file ? (
									<File className="h-12 w-12 text-geo-accent-blue mb-4" />
								) : (
									<Upload className="h-12 w-12 text-geo-text-muted mb-4" />
								)}
							</motion.div>

							{file ? (
								<div className="space-y-2">
									<p className="text-geo-text-light font-medium">
										{file.name}
									</p>
									<p className="text-sm text-geo-text-muted">
										{(file.size / 1024 / 1024).toFixed(2)}{' '}
										MB
									</p>
								</div>
							) : (
								<div className="space-y-2">
									<p className="text-geo-text-light font-medium">
										Drop your CSV file here or click to
										browse
									</p>
									<p className="text-sm text-geo-text-muted">
										Supports files up to 100MB
									</p>
								</div>
							)}
						</div>
					</motion.div>

					{/* Hidden file input */}
					<input
						ref={fileInputRef}
						type="file"
						accept=".csv"
						onChange={handleInputChange}
						className="hidden"
					/>

					{/* Progress bar */}
					<AnimatePresence>
						{uploading && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.3 }}
							>
								<Progress
									value={uploadProgress}
									className="w-full"
								/>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Upload button */}
					<Button
						onClick={handleSubmit}
						disabled={uploading || !file}
						className="w-full"
						size="lg"
					>
						{uploading ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Uploading... {uploadProgress}%
							</>
						) : (
							'Upload & Process Data'
						)}
					</Button>

					{/* Status message */}
					<AnimatePresence>
						{message && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.3 }}
								className="flex items-center gap-2 text-sm"
							>
								{getStatusIcon()}
								<span
									className={
										message.includes('successful')
											? 'text-geo-success'
											: message.includes('error') ||
											  message.includes('failed')
											? 'text-geo-error'
											: 'text-geo-text-muted'
									}
								>
									{message}
								</span>
							</motion.div>
						)}
					</AnimatePresence>
				</CardContent>
			</Card>
		</motion.div>
	);
};

export default UploadForm;
