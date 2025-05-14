import React from "react";

type ProfileImageProps = {
	svgString: string;
	size?: number;
	className?: string;
	alt?: string;
};

const ProfileImage: React.FC<ProfileImageProps> = React.memo(({
	svgString,
	size = 50,
	className = "",
	alt = "Profile Image",
}: ProfileImageProps) => {
	if (!svgString) {
		return <p>{alt}</p>;
	}

	return (
		<div
			className={className}
			style={{ width: size, height: size }}
			aria-label={alt}
			role="img"
			dangerouslySetInnerHTML={{ __html: svgString }}
		/>
	);
});

ProfileImage.displayName = 'ProfileImage';

export default ProfileImage;
